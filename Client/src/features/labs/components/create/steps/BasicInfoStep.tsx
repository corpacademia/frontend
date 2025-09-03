import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdOutlineChevronRight } from 'react-icons/md';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { toast } from 'react-toastify';

import {
  useGetLabsQuery,
  useCreateLabMutation,
  useDeleteLabMutation,
  useUpdateLabMutation,
} from '@Client/features/labs/api/labApi';
import {
  useGetSubjectsQuery,
  useCreateSubjectMutation,
} from '@Client/features/labs/api/subjectApi';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
} from '@Client/features/labs/api/categoryApi';
import { AiOutlinePlus } from 'react-icons/ai';
import { ConfirmModal } from '@Client/features/ui/components/ConfirmModal';
import { Pagination } from '@Client/features/ui/components/Pagination';

const CatalogueCard = ({ lab, onEditClick, onDeleteClick }) => {
  const navigate = useNavigate();

  const handleLabClick = () => {
    navigate(`/labs/catalogue/${lab.id}`);
  };

  return (
    <div
      className="bg-dark-400/50 border border-primary-500/20 rounded-lg p-4 cursor-pointer
                 hover:bg-dark-300 transition-colors duration-200 shadow-md flex justify-between items-center"
      onClick={handleLabClick}
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-1">{lab.name}</h3>
        <p className="text-sm text-gray-400">{lab.description}</p>
        <p className="text-xs text-gray-500 mt-2">
          Category: {lab.category?.name || 'N/A'} | Difficulty:{' '}
          {lab.difficulty || 'N/A'}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditClick(lab);
          }}
          className="text-primary-500 hover:text-primary-400 transition-colors duration-150"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(lab);
          }}
          className="text-red-500 hover:text-red-400 transition-colors duration-150"
        >
          Delete
        </button>
        <MdOutlineChevronRight className="text-gray-400 text-2xl" />
      </div>
    </div>
  );
};

const AddLabForm = ({
  formData,
  onUpdate,
  subjects,
  categories,
  isEditing = false,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Lab Name
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                     text-gray-300 focus:border-primary-500/40 focus:outline-none"
          placeholder="Enter lab name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none
                       resize-none h-24"
          placeholder="Describe what students will learn..."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Difficulty Level
          </label>
          <select
            value={formData.difficulty || ''}
            onChange={(e) => onUpdate({ difficulty: e.target.value })}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
          >
            <option value="">Select difficulty</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Category
          </label>
          <select
            value={formData.category?.id || formData.categoryId || ''}
            onChange={(e) => onUpdate({ categoryId: parseInt(e.target.value) })}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
          >
            <option value="">Select category</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Learning Objectives
        </label>
        <textarea
          value={formData.learningObjectives || ''}
          onChange={(e) => onUpdate({ learningObjectives: e.target.value })}
          className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none
                       resize-none h-20"
          placeholder="What will students achieve after completing this lab?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Prerequisites
        </label>
        <textarea
          value={formData.prerequisites || ''}
          onChange={(e) => onUpdate({ prerequisites: e.target.value })}
          className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none
                       resize-none h-16"
          placeholder="What knowledge or skills are required before taking this lab?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Target Audience
        </label>
        <input
          type="text"
          value={formData.targetAudience || ''}
          onChange={(e) => onUpdate({ targetAudience: e.target.value })}
          className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
          placeholder="e.g., Software Engineers, DevOps Engineers, Students"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Estimated Duration (minutes)
          </label>
          <input
            type="number"
            value={formData.estimatedDuration || ''}
            onChange={(e) =>
              onUpdate({ estimatedDuration: parseInt(e.target.value) || 0 })
            }
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
            placeholder="e.g., 60"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Price ($)
          </label>
          <input
            type="number"
            value={formData.price || ''}
            onChange={(e) =>
              onUpdate({ price: parseFloat(e.target.value) || 0 })
            }
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
            placeholder="e.g., 29.99"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Key Technologies/Tools
        </label>
        <input
          type="text"
          value={formData.technologies || ''}
          onChange={(e) => onUpdate({ technologies: e.target.value })}
          className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
          placeholder="e.g., AWS, Docker, Kubernetes, Python (comma-separated)"
        />
      </div>
    </div>
  );
};

const CatalogueView = () => {
  const [isLabCatalogueVisible, setIsLabCatalogueVisible] = useState(false);
  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [labToDelete, setLabToDelete] = useState(null);
  const [editingLab, setEditingLab] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [labsPerPage] = useState(10);

  const { data: labs, isLoading: isLoadingLabs } = useGetLabsQuery();
  const { data: subjects, isLoading: isLoadingSubjects } = useGetSubjectsQuery();
  const { data: categories, isLoading: isLoadingCategories } = useGetCategoriesQuery();
  const [createLab] = useCreateLabMutation();
  const [deleteLab] = useDeleteLabMutation();
  const [updateLab] = useUpdateLabMutation();

  const handleAddLabClick = () => {
    setEditingLab(null);
    setShowAddLabModal(true);
  };

  const handleEditLabClick = (lab) => {
    setEditingLab(lab);
    setShowAddLabModal(true);
  };

  const handleDeleteLabClick = (lab) => {
    setLabToDelete(lab);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (labToDelete) {
      await deleteLab(labToDelete.id);
      toast.success('Lab deleted successfully!');
      setIsConfirmModalOpen(false);
      setLabToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setLabToDelete(null);
  };

  const handleLabSubmit = async (labData) => {
    if (editingLab) {
      await updateLab({ id: editingLab.id, ...labData });
      toast.success('Lab updated successfully!');
    } else {
      await createLab(labData);
      toast.success('Lab created successfully!');
    }
    setShowAddLabModal(false);
    setEditingLab(null);
  };

  const handleCategorySubmit = async (categoryName) => {
    await createCategory({ name: categoryName });
    toast.success('Category created successfully!');
    setShowAddCategoryModal(false);
  };

  const handleSubjectSubmit = async (subjectName) => {
    await createSubject({ name: subjectName });
    toast.success('Subject created successfully!');
    setShowAddSubjectModal(false);
  };

  const handleLabCatalogueClick = () => {
    setIsLabCatalogueVisible(!isLabCatalogueVisible);
  };

  const indexOfLastLab = currentPage * labsPerPage;
  const indexOfFirstLab = indexOfLastLab - labsPerPage;
  const currentLabs = labs?.slice(indexOfFirstLab, indexOfLastLab);

  return (
    <div className="container mx-auto p-4">
      <div
        className="flex items-center justify-between mb-4 cursor-pointer p-3 bg-dark-400/50 border border-primary-500/20 rounded-lg"
        onClick={handleLabCatalogueClick}
      >
        <h2 className="text-2xl font-bold text-gray-200">Lab Catalogue</h2>
        <span className="text-primary-500">
          {isLabCatalogueVisible ? '-' : '+'}
        </span>
      </div>

      {isLabCatalogueVisible && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAddLabClick}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <AiOutlinePlus /> Add Lab
            </button>
          </div>
          {isLoadingLabs ? (
            <p>Loading labs...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentLabs?.map((lab) => (
                <CatalogueCard
                  key={lab.id}
                  lab={lab}
                  onEditClick={handleEditLabClick}
                  onDeleteClick={handleDeleteLabClick}
                />
              ))}
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            itemsPerPage={labsPerPage}
            totalItems={labs?.length || 0}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {showAddLabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-dark-400 p-8 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-primary-500/30">
            <h2 className="text-2xl font-bold mb-6 text-gray-200">
              {editingLab ? 'Edit Lab' : 'Add New Lab'}
            </h2>
            <AddLabForm
              formData={editingLab || {}}
              onUpdate={(data) =>
                setEditingLab((prev) => ({ ...prev, ...data }))
              }
              subjects={subjects}
              categories={categories}
              isEditing={!!editingLab}
            />
            <div className="flex justify-end mt-8 space-x-4">
              <button
                onClick={() => setShowAddLabModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLabSubmit(editingLab || {})}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {editingLab ? 'Save Changes' : 'Add Lab'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-dark-400 p-8 rounded-lg shadow-xl max-w-md w-full border border-primary-500/30">
            <h2 className="text-2xl font-bold mb-6 text-gray-200">
              Add New Category
            </h2>
            <input
              type="text"
              value={''}
              onChange={(e) => {}}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none mb-6"
              placeholder="Enter category name"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {}}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-dark-400 p-8 rounded-lg shadow-xl max-w-md w-full border border-primary-500/30">
            <h2 className="text-2xl font-bold mb-6 text-gray-200">
              Add New Subject
            </h2>
            <input
              type="text"
              value={''}
              onChange={(e) => {}}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none mb-6"
              placeholder="Enter subject name"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {}}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Add Subject
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the lab "${labToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default CatalogueView;