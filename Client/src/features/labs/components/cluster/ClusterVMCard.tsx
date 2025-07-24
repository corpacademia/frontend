import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../../../store/authStore";
import {
  BeakerIcon,
  BookOpenIcon,
  UserIcon,
  LayoutDashboardIcon,
  GraduationCapIcon,
  AwardIcon,
  CloudIcon,
  LinkIcon,
} from "lucide-react";
import {
  Server,
  Users,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
  AlertCircle,
  Loader,
  Power,
  Eye,
  EyeOff,
  FileText,
  Upload,
  Download,
} from "lucide-react";
import { GradientText } from "../../../../components/ui/GradientText";
import axios from "axios";
import { ClusterUserListModal } from "./ClusterUserListModal";
import { ConvertToCatalogueModal } from "../cloudvm/ConvertToCatalogueModal";
import { AssignUsersModal } from "../catalogue/AssignUsersModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from "uuid";

interface ClusterVM {
  id: string;
  lab_id: string;
  title: string;
  description: string;
  platform: string;
  protocol: string;
  startdate: string;
  enddate: string;
  status: "active" | "inactive" | "pending";
  users: Array<{
    id: string;
    username: string;
    vms: Array<{
      id: string;
      vmName: string;
      username: string;
      password: string;
      ip: string;
      port: string;
      protocol: string;
      disabled?: boolean;
    }>;
  }>;
  software?: string[];
  labguide?: string;
  userguide?: string;
  user_id?: string;
}

interface ClusterVMCardProps {
  vm: ClusterVM;
}

interface UserCredential {
  id?: string;
  username: string;
  password: string;
  ip: string;
  port: string;
  protocol: string;
  groupName?: string;
  vmName?: string;
}

interface VMConfig {
  id: string;
  name: string;
  protocol: string;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  vmTitle: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  vmTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="bg-dark-200 rounded-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            <GradientText>Confirm Deletion</GradientText>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-white">{vmTitle}</span>? This
            action cannot be undone.
          </p>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="btn-primary bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Deleting...
                </span>
              ) : (
                "Delete VM"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ClusterVMCard: React.FC<ClusterVMCardProps> = ({ vm }) => {
  const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showFullStartDate, setShowFullStartDate] = useState(false);
  const [showFullEndDate, setShowFullEndDate] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Edit lab modal states
  const [isEditLabModalOpen, setIsEditLabModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: vm.lab.title,
    description: vm.lab.description || "",
    startDate: new Date(vm.lab.startdate),
    endDate: new Date(vm.lab.enddate),
    credentials: [] as UserCredential[],
    vmConfigs: [] as VMConfig[],
    software: vm.lab.software || [],
    labGuide: vm.lab.labguide || "",
    userGuide: vm.lab.userguide || "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editNotification, setEditNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [labGuideFile, setLabGuideFile] = useState<File | null>(null);
  const [userGuideFile, setUserGuideFile] = useState<File | null>(null);
  // Add VM modal states
  const [isAddVMModalOpen, setIsAddVMModalOpen] = useState(false);
  const [newVMConfig, setNewVMConfig] = useState({
    name: "",
    protocol: "RDP",
  });

  function formatDate(dateString: string) {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    let hours = date.getHours();
    const minutes = `${date.getMinutes()}`.padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;
    hours = `${hours}`.padStart(1, "0");

    return `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
  }

  // Fetch current user details
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/user_profile`,
        );
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    if(!canEditContent()){
      try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/deleteFromOrganization`,{
          labId: vm?.lab?.labid,
          orgId: currentUser?.org_id,
          adminId: currentUser?.id
        }
      );

      if (response.data.success) {
        setNotification({
          type: "success",
          message: "Cluster VM deleted successfully",
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(response.data.message || "Failed to delete cluster VM");
      }
    } 
    catch (error: any) {
      setNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to delete cluster VM",
      });
      setTimeout(() => {
        setNotification(null);
      }, 1500);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
    }
    else{
         try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/deleteClusterLab/${vm?.lab?.labid}`,
      );

      if (response.data.success) {
        setNotification({
          type: "success",
          message: "Cluster VM deleted successfully",
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(response.data.message || "Failed to delete cluster VM");
      }
    } 
    catch (error: any) {
      setNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to delete cluster VM",
      });
      setTimeout(() => {
        setNotification(null);
      }, 1500);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
    }

  };

  // Initialize edit form data with user credentials and VM configs
  useEffect(() => {
    if (vm.users && vm.users.length > 0) {
      const credentials = vm.users.map((vmItem) => ({
        id: vmItem.id,
        username: vmItem.username,
        password: vmItem.password,
        ip: vmItem.ip,
        port: vmItem.port,
        protocol: vmItem.protocol || "RDP",
        groupName: vmItem.usergroup || "",
        vmName: vm.vms.find((vm) => vm.vmid === vmItem.vmid)?.vmname || "",
      }));

      // Extract unique VM configurations from existing credentials
      const vmConfigs: VMConfig[] = [];
      const seenVMs = new Set();

      vm.users.forEach((user) => {
        const matchedVM = vm.vms.find((vmItem) => vmItem.vmid === user.vmid);

        if (matchedVM) {
          const vmKey = `${matchedVM.vmname}-${matchedVM.protocol}`;
          if (!seenVMs.has(vmKey)) {
            seenVMs.add(vmKey);
            vmConfigs.push({
              id: user.vmid || uuidv4(),
              name: matchedVM.vmname || "",
              protocol: matchedVM.protocol,
            });
          }
        }
      });

      setEditFormData((prev) => ({
        ...prev,
        credentials: credentials,
        vmConfigs: vmConfigs,
      }));
    } else {
      // Add a default empty credential if none exist
      setEditFormData((prev) => ({
        ...prev,
        credentials: [
          {
            username: "",
            password: "",
            ip: "",
            port: "",
            protocol: "RDP",
            groupName: "",
            vmName: "",
          },
        ],
        vmConfigs: [],
      }));
    }
  }, [vm.users]);

  const handleCredentialChange = (
    index: number,
    field: keyof UserCredential,
    value: string,
  ) => {
    const updatedCredentials = [...editFormData.credentials];
    updatedCredentials[index] = {
      ...updatedCredentials[index],
      [field]: value,
    };
    setEditFormData({
      ...editFormData,
      credentials: updatedCredentials,
    });
  };

  const handleVMConfigChange = (
    index: number,
    field: keyof Omit<VMConfig, "id">,
    value: string,
  ) => {
    const updatedVMConfigs = [...editFormData.vmConfigs];
    updatedVMConfigs[index] = {
      ...updatedVMConfigs[index],
      [field]: value,
    };

    // Update default port for this VM in all credentials
    if (field === "protocol") {
      const defaultPort =
        value === "RDP" ? "3389" : value === "SSH" ? "22" : "5900";
      const vmName = updatedVMConfigs[index].name;

      const updatedCredentials = editFormData.credentials.map((cred) =>
        cred.vmName === vmName
          ? { ...cred, port: defaultPort, protocol: value }
          : cred,
      );

      setEditFormData({
        ...editFormData,
        vmConfigs: updatedVMConfigs,
        credentials: updatedCredentials,
      });
    } else {
      setEditFormData({
        ...editFormData,
        vmConfigs: updatedVMConfigs,
      });
    }
  };

  const handleAddVMConfig = () => {
    setIsAddVMModalOpen(true);
  };

  const handleRemoveVMConfig = (index: number) => {
    const vmToRemove = editFormData.vmConfigs[index];
    const updatedVMConfigs = [...editFormData.vmConfigs];
    updatedVMConfigs.splice(index, 1);

    // Remove all credentials associated with this VM
    const updatedCredentials = editFormData.credentials.filter(
      (cred) => cred.vmName !== vmToRemove.name,
    );

    setEditFormData({
      ...editFormData,
      vmConfigs: updatedVMConfigs,
      credentials: updatedCredentials,
    });
  };

  const handleConfirmAddVM = () => {
    if (!newVMConfig.name.trim()) return;

    const newVM: VMConfig = {
      id: uuidv4(),
      name: newVMConfig.name,
      protocol: newVMConfig.protocol,
    };

    // Get unique group names from existing credentials
    const existingGroups = [
      ...new Set(
        editFormData.credentials.map((cred) => cred.groupName).filter(Boolean),
      ),
    ];

    // If no groups exist, create a default one
    const groupsToUse =
      existingGroups.length > 0 ? existingGroups : ["User Group 1"];

    // Create credentials for each group for this new VM
    const defaultPort =
      newVMConfig.protocol === "RDP"
        ? "3389"
        : newVMConfig.protocol === "SSH"
          ? "22"
          : "5900";

    const newCredentials = groupsToUse.map((groupName) => ({
      id: uuidv4(),
      username: "",
      password: "",
      ip: "",
      port: defaultPort,
      protocol: newVMConfig.protocol,
      groupName: groupName,
      vmName: newVMConfig.name,
    }));

    setEditFormData({
      ...editFormData,
      vmConfigs: [...editFormData.vmConfigs, newVM],
      credentials: [...editFormData.credentials, ...newCredentials],
    });

    // Reset modal state
    setNewVMConfig({ name: "", protocol: "RDP" });
    setIsAddVMModalOpen(false);
  };

  const handleAddCredential = () => {
    setEditFormData({
      ...editFormData,
      credentials: [
        ...editFormData.credentials,
        {
          id: uuidv4(),
          username: "",
          password: "",
          ip: "",
          port: "",
          protocol: "RDP",
          groupName: "",
          vmName: "",
        },
      ],
    });
  };

  const handleRemoveCredential = (index: number) => {
    if (editFormData.credentials.length <= 1) return;

    const updatedCredentials = [...editFormData.credentials];
    updatedCredentials.splice(index, 1);
    setEditFormData({
      ...editFormData,
      credentials: updatedCredentials,
    });
  };

  const handleSoftwareChange = (index: number, value: string) => {
    const updatedSoftware = [...editFormData.software];
    updatedSoftware[index] = value;
    setEditFormData({
      ...editFormData,
      software: updatedSoftware,
    });
  };

  const handleAddSoftware = () => {
    setEditFormData({
      ...editFormData,
      software: [...editFormData.software, ""],
    });
  };

  const handleRemoveSoftware = (index: number) => {
    const updatedSoftware = [...editFormData.software];
    updatedSoftware.splice(index, 1);
    setEditFormData({
      ...editFormData,
      software: updatedSoftware,
    });
  };

  const handleLabGuideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLabGuideFile(e.target.files[0]);
    }
  };

  const handleUserGuideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUserGuideFile(e.target.files[0]);
    }
  };

  const handleEditLabSubmit = async () => {
    setIsEditing(true);
    setEditNotification(null);

    try {
      // Format dates for API
      const formattedStartDate = formatDate(editFormData.startDate);
      const formattedEndDate = formatDate(editFormData.endDate);

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append("labId", vm.lab.labid);
      formData.append("title", editFormData.title);
      formData.append("description", editFormData.description);
      formData.append("startDate", formattedStartDate);
      formData.append("endDate", formattedEndDate);
      const software = editFormData.software.filter((s) => s.trim() !== "");
      formData.append("software", JSON.stringify(software));
      formData.append("credentials", JSON.stringify(editFormData.credentials));
      formData.append("vmConfigs", JSON.stringify(editFormData.vmConfigs));

      // Always include existing file references if available
      if (editFormData.labGuide) {
        formData.append("existingLabGuide", editFormData.labGuide);
      }
      if (editFormData.userGuide) {
        formData.append("existingUserGuide", editFormData.userGuide);
      }

      // Append new file if selected (optional overwrite or addition)
      if (labGuideFile) {
        formData.append("labGuide", labGuideFile);
      }
      if (userGuideFile) {
        formData.append("userGuide", userGuideFile);
      }
      // Update lab details
      const labResponse = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/updateClusterLab`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (!labResponse.data.success) {
        throw new Error(
          labResponse.data.message || "Failed to update lab details",
        );
      }

      setEditNotification({
        type: "success",
        message: "Lab updated successfully",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setEditNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to update lab",
      });
      setTimeout(() => {
        setEditNotification(null);
      }, 1500);
    } finally {
      setIsEditing(false);
    }
  };

  const handleConvertToCatalogue = async () => {
    setIsConvertModalOpen(true);
  };

  // Extract filename from path
  function extractFileName(filePath: string) {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : null;
  }

  // Check if current user can edit content
  const canEditContent = () => {
    return currentUser?.role === 'superadmin' || currentUser?.role === 'orgsuperadmin';
  };

  // Group credentials by VM name for better organization
  const groupedCredentials = editFormData.credentials.reduce(
    (acc, cred, index) => {
      const vmName = cred.vmName || "Unassigned";
      if (!acc[vmName]) {
        acc[vmName] = [];
      }
      acc[vmName].push({ ...cred, originalIndex: index });
      return acc;
    },
    {} as Record<string, Array<UserCredential & { originalIndex: number }>>,
  );
  return (
    <>
      <div
        className="flex flex-col h-[320px] overflow-hidden rounded-xl border border-secondary-500/10 
                    hover:border-secondary-500/30 bg-dark-200/80 backdrop-blur-sm
                    transition-all duration-300 hover:shadow-lg hover:shadow-secondary-500/10 
                    hover:translate-y-[-2px] group relative"
      >
        {notification && (
          <div
            className={`absolute top-2 right-2 px-4 py-2 rounded-lg flex items-center space-x-2 z-50 ${
              notification.type === "success"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            {notification.type === "success" ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{notification.message}</span>
          </div>
        )}

        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-start gap-4 mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">
                <GradientText>{vm.lab.title}</GradientText>
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2">
                {vm.lab.description}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {canEditContent() && (
                <button
                  onClick={() => setIsEditLabModalOpen(true)}
                  className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
                >
                  <Pencil className="h-4 w-4 text-primary-400" />
                </button>
              )}

                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>

              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  vm.lab.status === "active"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : vm.lab.status === "inactive"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {vm.lab.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="flex items-center text-sm text-gray-400">
              <Server className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span className="truncate">{vm.lab.platform}</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <LinkIcon className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span className="truncate">rdp/ssh/vnc</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Calendar className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span
                className={`${showFullStartDate ? "" : "truncate"} cursor-pointer`}
                onClick={() => setShowFullStartDate(!showFullStartDate)}
                title={
                  showFullStartDate ? "Click to collapse" : "Click to expand"
                }
              >
                Start: {formatDate(vm?.lab?.startdate)}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="h-4 w-4 mr-2 text-secondary-400 flex-shrink-0" />
              <span
                className={`${showFullEndDate ? "" : "truncate"} cursor-pointer`}
                onClick={() => setShowFullEndDate(!showFullEndDate)}
                title={
                  showFullEndDate ? "Click to collapse" : "Click to expand"
                }
              >
                End: {formatDate(vm?.lab?.enddate)}
              </span>
            </div>
          </div>

          {/* Software Section */}
          {vm.lab.software && vm.lab.software.length > 0 && (
            <div className="mb-3 max-h-[60px] overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-400 mb-1">
                Software:
              </h4>
              <div className="flex flex-wrap gap-2">
                {vm.lab.software.map((sw, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs font-medium rounded-full bg-secondary-500/20 text-secondary-300"
                  >
                    {sw}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-secondary-500/10 flex flex-col space-y-2">
            <button
              onClick={() => setIsUserListModalOpen(true)}
              className="w-full h-9 px-4 rounded-lg text-sm font-medium
                       bg-dark-400/80 hover:bg-dark-300/80
                       border border-secondary-500/20 hover:border-secondary-500/30
                       text-secondary-300
                       flex items-center justify-center"
            >
              <Users className="h-4 w-4 mr-2" />
              User List
            </button>

            {!canEditContent() && currentUser?.role === "orgadmin" ? (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="w-full h-9 px-4 rounded-lg text-sm font-medium
                         bg-gradient-to-r from-secondary-500 to-accent-500
                         hover:from-secondary-400 hover:to-accent-400
                         transform hover:scale-105 transition-all duration-300
                         text-white shadow-lg shadow-secondary-500/20
                         flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Lab
              </button>
            ) : (
              canEditContent() && (
                <button
                  onClick={handleConvertToCatalogue}
                  disabled={isConverting}
                  className="w-full h-9 px-4 rounded-lg text-sm font-medium
                         bg-gradient-to-r from-secondary-500 to-accent-500
                         hover:from-secondary-400 hover:to-accent-400
                         transform hover:scale-105 transition-all duration-300
                         text-white shadow-lg shadow-secondary-500/20
                         flex items-center justify-center"
                >
                  {isConverting ? (
                    <Loader className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Convert to Catalogue
                    </>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {isUserListModalOpen && (
        <ClusterUserListModal
          isOpen={isUserListModalOpen}
          onClose={() => setIsUserListModalOpen(false)}
          users={vm.users || []}
          vmId={vm.lab.labid}
          vmTitle={vm.lab.title}
          vm={vm}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        vmTitle={vm.lab.title}
      />

      <ConvertToCatalogueModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        vmId={vm?.lab?.labid}
        isClusterDatacenterVM={true}
      />

      <AssignUsersModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        lab={vm?.lab}
        type="cluster"
      />

      {/* Add VM Modal */}
      {isAddVMModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-dark-200 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                <GradientText>Add VM Configuration</GradientText>
              </h2>
              <button
                onClick={() => setIsAddVMModalOpen(false)}
                className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  VM Name
                </label>
                <input
                  type="text"
                  value={newVMConfig.name}
                  onChange={(e) =>
                    setNewVMConfig({ ...newVMConfig, name: e.target.value })
                  }
                  placeholder="Enter VM name"
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Protocol
                </label>
                <select
                  value={newVMConfig.protocol}
                  onChange={(e) =>
                    setNewVMConfig({ ...newVMConfig, protocol: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="RDP">RDP</option>
                  <option value="SSH">SSH</option>
                  <option value="VNC">VNC</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setIsAddVMModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddVM}
                disabled={!newVMConfig.name.trim()}
                className="btn-primary"
              >
                Add VM & Generate Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lab Modal */}
      {isEditLabModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                <GradientText>Edit Lab</GradientText>
              </h2>
              The code has been updated to include orgsuperadmin role for lab edits and catalogue conversions.<button
                onClick={() => setIsEditLabModalOpen(false)}
                className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {editNotification && (
              <div
                className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
                  editNotification.type === "success"
                    ? "bg-emerald-500/20 border border-emerald-500/20"
                    : "bg-red-500/20 border border-red-500/20"
                }`}
              >
                {editNotification.type === "success" ? (
                  <Check className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <span
                  className={`text-sm ${
                    editNotification.type === "success"
                      ? "text-emerald-300"
                      : "text-red-300"
                  }`}
                >
                  {editNotification.message}
                </span>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lab Title
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Date & Time
                  </label>
                  <DatePicker
                    selected={editFormData.startDate}
                    onChange={(date: Date) =>
                      setEditFormData({ ...editFormData, startDate: date })
                    }
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Date & Time
                  </label>
                  <DatePicker
                    selected={editFormData.endDate}
                    onChange={(date: Date) =>
                      setEditFormData({ ...editFormData, endDate: date })
                    }
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* VM Configurations Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-300">
                    VM Configurations
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVMConfig}
                    className="text-sm text-primary-400 hover:text-primary-300 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add VM
                  </button>
                </div>

                {editFormData.vmConfigs.map((vmConfig, index) => (
                  <div
                    key={vmConfig.id}
                    className="p-4 bg-dark-300/50 rounded-lg mb-4"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-300">
                        VM {index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveVMConfig(index)}
                        className="p-1 hover:bg-red-500/10 rounded-lg text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          VM Name
                        </label>
                        <input
                          type="text"
                          value={vmConfig.name}
                          onChange={(e) =>
                            handleVMConfigChange(index, "name", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                   text-gray-300 focus:border-primary-500/40 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Protocol
                        </label>
                        <select
                          value={vmConfig.protocol}
                          onChange={(e) =>
                            handleVMConfigChange(
                              index,
                              "protocol",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                   text-gray-300 focus:border-primary-500/40 focus:outline-none"
                        >
                          <option value="RDP">RDP</option>
                          <option value="SSH">SSH</option>
                          <option value="VNC">VNC</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Software Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Software
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSoftware}
                    className="text-sm text-primary-400 hover:text-primary-300 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Software
                  </button>
                </div>

                {editFormData.software.map((sw, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={sw}
                      onChange={(e) =>
                        handleSoftwareChange(index, e.target.value)
                      }
                      placeholder="Enter software name"
                      className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSoftware(index)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Lab Guide and User Guide Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Lab Guide
                  </label>
                  <div className="flex flex-col space-y-2">
                    {vm.lab.labguide &&
                      editFormData.labGuide.map((labguide) => (
                        <div className="flex items-center justify-between p-2 bg-dark-300/50 rounded-lg">
                          <span className="text-sm text-gray-300 truncate">
                            {extractFileName(labguide)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <a
                              href={`${import.meta.env.VITE_BACKEND_URL}/${extractFileName(labguide)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-primary-500/10 rounded-lg"
                            >
                              <Download className="h-4 w-4 text-primary-400" />
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                setEditFormData({
                                  ...editFormData,
                                  labGuide: [],
                                })
                              }
                              className="p-1 hover:bg-red-500/10 rounded-lg"
                            >
                              <X className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        id="labGuide"
                        onChange={handleLabGuideChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                      />
                      <label
                        htmlFor="labGuide"
                        className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                 text-gray-300 cursor-pointer hover:bg-dark-400 transition-colors
                                 flex items-center justify-center"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {labGuideFile
                          ? labGuideFile.name
                          : "Upload New Lab Guide"}
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    User Guide
                  </label>
                  <div className="flex flex-col space-y-2">
                    {vm.lab.userguide &&
                      editFormData.userGuide.map((userguide) => (
                        <div className="flex items-center justify-between p-2 bg-dark-300/50 rounded-lg">
                          <span className="text-sm text-gray-300 truncate">
                            {extractFileName(userguide)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <a
                              href={`${import.meta.env.VITE_BACKEND_URL}/${extractFileName(userguide)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-primary-500/10 rounded-lg"
                            >
                              <Download className="h-4 w-4 text-primary-400" />
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                setEditFormData({
                                  ...editFormData,
                                  userGuide: "",
                                })
                              }
                              className="p-1 hover:bg-red-500/10 rounded-lg"
                            >
                              <X className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        id="userGuide"
                        onChange={handleUserGuideChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                      />
                      <label
                        htmlFor="userGuide"
                        className="flex-1 px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                 text-gray-300 cursor-pointer hover:bg-dark-400 transition-colors
                                 flex items-center justify-center"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {userGuideFile
                          ? userGuideFile.name
                          : "Upload New User Guide"}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Credentials Section - Organized by VM */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-300">
                    User Credentials
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCredential}
                    className="text-sm text-primary-400 hover:text-primary-300 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Individual Credential
                  </button>
                </div>

                {Object.entries(groupedCredentials).map(
                  ([vmName, credentials]) => (
                    <div key={vmName} className="mb-6">
                      <h3 className="text-md font-medium text-gray-200 mb-3 flex items-center">
                        <Server className="h-4 w-4 mr-2 text-primary-400" />
                        {vmName}
                      </h3>

                      {credentials.map((cred) => (
                        <div
                          key={cred.originalIndex}
                          className="p-4 bg-dark-300/50 rounded-lg mb-4"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-medium text-gray-300">
                              {cred.groupName || "Unnamed Group"}
                            </h4>
                            {editFormData.credentials.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveCredential(cred.originalIndex)
                                }
                                className="p-1 hover:bg-red-500/10 rounded-lg text-red-400"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                User Group Name
                              </label>
                              <input
                                type="text"
                                value={cred.groupName || ""}
                                onChange={(e) =>
                                  handleCredentialChange(
                                    cred.originalIndex,
                                    "groupName",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter user group name"
                                className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                VM Name
                              </label>
                              <select
                                value={cred.vmName || ""}
                                onChange={(e) =>
                                  handleCredentialChange(
                                    cred.originalIndex,
                                    "vmName",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
                              >
                                <option value="">Select VM</option>
                                {editFormData.vmConfigs.map((vm) => (
                                  <option key={vm.id} value={vm.name}>
                                    {vm.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                Username
                              </label>
                              <input
                                type="text"
                                value={cred.username}
                                onChange={(e) =>
                                  handleCredentialChange(
                                    cred.originalIndex,
                                    "username",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                Password
                              </label>
                              <input
                                type="text"
                                value={cred.password}
                                onChange={(e) =>
                                  handleCredentialChange(
                                    cred.originalIndex,
                                    "password",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                IP Address
                              </label>
                              <input
                                type="text"
                                value={cred.ip}
                                onChange={(e) =>
                                  handleCredentialChange(
                                    cred.originalIndex,
                                    "ip",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                Port
                              </label>
                              <input
                                type="text"
                                value={cred.port}
                                onChange={(e) =>
                                  handleCredentialChange(
                                    cred.originalIndex,
                                    "port",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setIsEditLabModalOpen(false)}
                className="btn-secondary"
                disabled={isEditing}
              >
                Cancel
              </button>
              <button
                onClick={handleEditLabSubmit}
                disabled={isEditing}
                className="btn-primary"
              >
                {isEditing ? (
                  <span className="flex items-center">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};