import type { TaskLog, ExperimentData } from '../types/experiment';

function calculatePathEfficiency(clicks: any[], targetPath: string[]): number {
  if (!clicks || clicks.length === 0) return 0;
  const optimalSteps = targetPath ? targetPath.length : 3;
  return Math.min(1.0, optimalSteps / clicks.length);
}

export async function submitToNetlify(allLogs: TaskLog[], participantId: string): Promise<void> {
  const formattedData: ExperimentData = {
    metadata: {
      participantId,
      experimentDate: new Date().toISOString(),
      totalTasks: allLogs.length,
    },
    taskResults: allLogs.map(task => ({
      taskOverview: {
        taskIndex: task.taskIndex,
        targetItem: task.correctItem,
        targetPath: task.correctPath.join(' > '),
        easingFunction: task.usedEasing,
        totalTimeSec: parseFloat(task.totalTime),
        firstClickDelaySec: task.firstClickTime,
        success: !task.timedOut && task.errorCount === 0
      },
      navigationPath: task.clicks || [],
      performance: {
        errorCount: task.errorCount,
        menuTravelDistance: task.menuTravelDistance,
        pathEfficiency: calculatePathEfficiency(task.clicks, task.correctPath),
        timedOut: task.timedOut
      },
      userFeedback: {
        animationEaseRating: task.animationEaseRating || null,
        taskDifficultyRating: task.taskDifficultyRating || null,
        animationDifferenceRating: task.animationDifferenceRating || null,
        comments: task.comments || ""
      },
    }))
  };

  const formData = new FormData();
  formData.append('form-name', 'results');
  formData.append('participant', participantId);
  formData.append('jsonData', JSON.stringify(formattedData, null, 2));

  await fetch('/', {
    method: 'POST',
    body: formData,
  });

  // Redirect to thank-you page
  window.location.href = `thank-you.html?participant=${encodeURIComponent(participantId)}`;
}
