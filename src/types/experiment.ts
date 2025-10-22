export type EasingFunction = 'linear' | 'easeInOutQuad' | 'easeInOutQuint' | 'easeInOutExpo' | 'easeInOutBack';

export interface Category {
  name: string;
  subcategories?: Category[];
}

export interface Task {
  category: string;
  subcat: string;
  item: string;
}

export interface ClickLog {
  step: number;
  action: string;
  depth: number;
  duringAnimation: boolean;
  stayTime: number;
  timestamp: string;
}

export interface TaskLog {
  taskIndex: number;
  correctItem: string;
  correctPath: string[];
  totalTime: string;
  errorCount: number;
  timedOut: boolean;
  usedEasing: EasingFunction;
  firstClickTime: number | null;
  menuTravelDistance: number;
  clicks: ClickLog[];
  animationEaseRating?: string;
  taskDifficultyRating?: string;
  animationDifferenceRating?: string;
  comments?: string;
  timestamp?: string;
}

export interface ExperimentData {
  metadata: {
    participantId: string;
    experimentDate: string;
    totalTasks: number;
  };
  taskResults: Array<{
    taskOverview: {
      taskIndex: number;
      targetItem: string;
      targetPath: string;
      easingFunction: EasingFunction;
      totalTimeSec: number;
      firstClickDelaySec: number | null;
      success: boolean;
    };
    navigationPath: ClickLog[];
    performance: {
      errorCount: number;
      menuTravelDistance: number;
      pathEfficiency: number;
      timedOut: boolean;
    };
    userFeedback: {
      animationEaseRating: string | null;
      taskDifficultyRating: string | null;
      animationDifferenceRating: string | null;
      comments: string;
    };
  }>;
}
