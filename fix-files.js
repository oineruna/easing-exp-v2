// Script to fix PostSurveyOverlay.tsx and RewardScreen.tsx

const fs = require('fs');
const path = require('path');

// Fix PostSurveyOverlay.tsx
const postSurveyPath = path.join(__dirname, 'src/components/PostSurveyOverlay.tsx');
let postSurveyContent = fs.readFileSync(postSurveyPath, 'utf8');

// Remove participantId from result objects
postSurveyContent = postSurveyContent.replace(
    /const result: PostSurveyResult = \{\s*participantId,/,
    'const result: PostSurveyResult = {'
);
postSurveyContent = postSurveyContent.replace(
    /const dummyResult: PostSurveyResult = \{\s*participantId,/,
    'const dummyResult: PostSurveyResult = {'
);

fs.writeFileSync(postSurveyPath, postSurveyContent);
console.log('Fixed PostSurveyOverlay.tsx');

// Fix RewardScreen.tsx
const rewardScreenPath = path.join(__dirname, 'src/components/RewardScreen.tsx');
let rewardContent = fs.readFileSync(rewardScreenPath, 'utf8');

// Replace errorClicks with errorCount
rewardContent = rewardContent.replace(/\.errorClicks/g, '.errorCount');

// Replace totalTime with calculated value
rewardContent = rewardContent.replace(/\.totalTime/g, '.totalDuration');

// Replace totalClicks with clickCount
rewardContent = rewardContent.replace(/\.totalClicks/g, '.clickCount');

fs.writeFileSync(rewardScreenPath, rewardContent);
console.log('Fixed RewardScreen.tsx');

console.log('All files fixed successfully!');
