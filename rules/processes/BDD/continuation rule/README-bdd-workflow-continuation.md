# BDD Workflow Continuation Rule

## Overview
The BDD workflow continuation rule is a system designed to help developers continue working on Behavior-Driven Development (BDD) features across multiple development sessions. It preserves context and avoids duplication of completed work by tracking progress and providing a structured way to resume work.

## Components

### 1. Status Script (`bdd-status-script.js`)
- Analyzes the project to determine the current state of BDD workflows
- Scans for story files, feature files, step definitions, and implementation files
- Determines the current progress based on file existence and test status
- Generates a status report with file paths and completion status
- Identifies the appropriate checkpoint to resume from

### 2. Continuation Script (`bdd-continue-script.js`)
- Creates a context file for continuing a BDD workflow in a new chat session
- Loads relevant files and creates a structured prompt
- Populates a template with feature-specific information
- Generates files needed for workflow continuation

### 3. Prompt Template (`.cursor/bdd-continuation-prompt.txt`)
- Template with placeholders for feature name, module name, current stage, etc.
- Gets populated with feature-specific information

## Workflow Stages
1. **Story Creation**: Creating the user story document
2. **Feature Creation**: Creating the feature file with scenarios
3. **Steps Definition**: Defining step definitions for scenarios
4. **BDD Implementation**: Implementing functionality to make BDD tests pass
5. **Unit Testing**: Writing and implementing unit tests
6. **Scenario Completion**: Ensuring all scenarios are complete and passing
7. **Feature Documentation**: Documenting the completed feature

## Checkpoints
- **After Story Creation**: Has user story document, ready for feature file
- **After Feature Creation**: Has feature file with scenarios, ready for step definitions
- **After Steps Definition**: Has step definitions, ready for implementation
- **During BDD Implementation**: Has partial implementation, tests may be failing
- **During Unit Testing**: BDD tests passing, unit tests in progress
- **After Test Completion**: All tests passing, ready for documentation

## Usage Flow
1. Run `node scripts/bdd-status-script.js` to generate a status report
2. Run `node scripts/bdd-continue-script.js "feature-name"` to create a continuation prompt
3. Copy the content of the generated prompt file
4. Paste it into a new Cursor chat session to resume work

## Key Files
- `.cursor/bdd-status-report.json`: Contains the current status of all BDD features
- `.cursor/bdd-prompt-{feature-name}.md`: Contains the prompt for continuing a specific feature
- `.cursor/bdd-context-{feature-name}.json`: Contains the context data for a specific feature

## Benefits
- Maintains continuity in the BDD workflow
- Tracks progress across multiple development sessions
- Loads relevant files automatically
- Provides clear instructions on what needs to be done next
- Makes it easier to pick up work where you left off
- Ensures consistent implementation of BDD practices
- Reduces context switching overhead

## Implementation Notes
The rule works by scanning the project structure to identify BDD artifacts and their relationships. It uses file existence, naming conventions, and test status to determine the current stage of each feature. The system is designed to be flexible and can be adapted to different project structures and BDD implementations. 