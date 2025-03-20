export interface CloudMetrics {
  totalResources: number;
  activeResources: number;
  idleResources: number;
  compute: {
    usage: number;
    vcpus: number;
    ram: number;
  };
  storage: {
    used: number;
    total: number;
    available: number;
  };
  network: {
    bandwidth: number;
    ingress: number;
    egress: number;
  };
}

export interface CloudProvider {
  name: string;
  resourceCount: number;
  cost: number;
  utilizationPercentage: number;
  metrics: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

export interface ResourceAllocation {
  name: string;
  value: number;
}