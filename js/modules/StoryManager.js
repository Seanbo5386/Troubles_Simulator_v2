export class StoryManager {
    constructor(storyGraph) {
        this.storyGraph = storyGraph;
        this.currentNode = null;
        this.nodeHistory = [];
        this.storyState = {};
    }

    init() {
        this.currentNode = this.storyGraph.nodes[this.storyGraph.startNode];
        this.nodeHistory = [];
        this.storyState = {};
        console.log('Story manager initialized');
    }

    getCurrentNode() {
        return this.currentNode;
    }

    getNode(nodeId) {
        return this.storyGraph.nodes[nodeId];
    }

    navigateToNode(nodeId, context = {}) {
        const targetNode = this.getNode(nodeId);
        if (!targetNode) {
            console.error(`Node ${nodeId} not found`);
            return null;
        }

        // Add current node to history
        if (this.currentNode) {
            this.nodeHistory.push(this.currentNode.id);
        }

        // Process node text with context
        const processedNode = this.processNodeText(targetNode, context);
        
        this.currentNode = processedNode;
        return processedNode;
    }

    processNodeText(node, context = {}) {
        const processedNode = { ...node };
        
        // Process text with template variables
        if (node.text) {
            processedNode.text = this.processTemplateText(node.text, context);
        }
        
        // Process choices
        if (node.choices) {
            processedNode.choices = node.choices.map(choice => ({
                ...choice,
                text: this.processTemplateText(choice.text, context),
                available: this.evaluateChoiceRequirements(choice, context)
            }));
        }
        
        return processedNode;
    }

    processTemplateText(text, context) {
        if (!text || typeof text !== 'string') return text;
        
        // Replace template variables like {variableName}
        return text.replace(/\{([^}]+)\}/g, (match, variable) => {
            // Check context first
            if (context[variable] !== undefined) {
                return context[variable];
            }
            
            // Check story state
            if (this.storyState[variable] !== undefined) {
                return this.storyState[variable];
            }
            
            // Check special variables
            switch (variable) {
                case 'currentLocation':
                    return context.currentLocation || 'unknown location';
                case 'playerName':
                    return context.playerName || 'you';
                case 'currentTime':
                    return new Date().toLocaleTimeString();
                default:
                    console.warn(`Unknown template variable: ${variable}`);
                    return match; // Return original if not found
            }
        });
    }

    evaluateChoiceRequirements(choice, context) {
        if (!choice.requirements || choice.requirements.length === 0) {
            return true;
        }

        return choice.requirements.every(requirement => {
            return this.evaluateRequirement(requirement, context);
        });
    }

    evaluateRequirement(requirement, context) {
        const { type, key, value, operator = 'equals' } = requirement;
        
        switch (type) {
            case 'stat':
                const statValue = context.playerStats?.[key] || 0;
                return this.compareValues(statValue, value, operator);
                
            case 'reputation':
                const repValue = context.factionReputation?.[key] || 0;
                return this.compareValues(repValue, value, operator);
                
            case 'inventory':
                const hasItem = context.inventory?.includes(key) || false;
                return value ? hasItem : !hasItem;
                
            case 'flag':
                const flagValue = this.storyState[key] || false;  
                return value ? flagValue : !flagValue;
                
            case 'location':
                return context.currentLocation === value;
                
            case 'character':
                return context.characterId === value;
                
            default:
                console.warn(`Unknown requirement type: ${type}`);
                return true;
        }
    }

    compareValues(actual, expected, operator) {
        switch (operator) {
            case 'equals':
            case '==':
                return actual === expected;
            case 'not_equals':
            case '!=':
                return actual !== expected;
            case 'greater_than':
            case '>':
                return actual > expected;
            case 'greater_than_or_equal':
            case '>=':
                return actual >= expected;
            case 'less_than':
            case '<':
                return actual < expected;
            case 'less_than_or_equal':
            case '<=':
                return actual <= expected;
            default:
                console.warn(`Unknown operator: ${operator}`);
                return false;
        }
    }

    setStoryFlag(key, value) {
        this.storyState[key] = value;
    }

    getStoryFlag(key) {
        return this.storyState[key];
    }

    canGoBack() {
        return this.nodeHistory.length > 0;
    }

    goBack() {
        if (!this.canGoBack()) {
            return null;
        }
        
        const previousNodeId = this.nodeHistory.pop();
        const previousNode = this.getNode(previousNodeId);
        
        if (previousNode) {
            this.currentNode = previousNode;
            return previousNode;
        }
        
        return null;
    }

    getStoryProgress() {
        return {
            currentNodeId: this.currentNode?.id,
            nodeHistory: [...this.nodeHistory],
            storyState: { ...this.storyState }
        };
    }

    restoreStoryProgress(progress) {
        if (!progress) return false;
        
        try {
            this.currentNode = this.getNode(progress.currentNodeId);
            this.nodeHistory = [...progress.nodeHistory];
            this.storyState = { ...progress.storyState };
            return true;
        } catch (error) {
            console.error('Failed to restore story progress:', error);
            return false;
        }
    }

    // Utility methods for story branching
    getBranchingPaths(nodeId = null) {
        const node = nodeId ? this.getNode(nodeId) : this.currentNode;
        if (!node || !node.choices) return [];
        
        return node.choices.map(choice => ({
            choiceText: choice.text,
            nextNode: choice.nextNode,
            effects: choice.effects
        }));
    }

    getReachableNodes(startNodeId = null) {
        const startNode = startNodeId || this.currentNode?.id;
        if (!startNode) return [];
        
        const visited = new Set();
        const reachable = [];
        
        const traverse = (nodeId) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            
            const node = this.getNode(nodeId);
            if (!node) return;
            
            reachable.push(nodeId);
            
            if (node.choices) {
                node.choices.forEach(choice => {
                    if (choice.nextNode) {
                        traverse(choice.nextNode);
                    }
                });
            }
        };
        
        traverse(startNode);
        return reachable.filter(id => id !== startNode);
    }

    // Analytics and debugging
    getStoryStatistics() {
        const allNodes = Object.keys(this.storyGraph.nodes);
        const nodeTypes = {};
        const choiceCounts = {};
        
        allNodes.forEach(nodeId => {
            const node = this.storyGraph.nodes[nodeId];
            nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
            
            if (node.choices) {
                choiceCounts[nodeId] = node.choices.length;
            }
        });
        
        return {
            totalNodes: allNodes.length,
            nodeTypes,
            choiceCounts,
            averageChoicesPerNode: Object.values(choiceCounts).reduce((a, b) => a + b, 0) / Object.keys(choiceCounts).length || 0
        };
    }

    validateStoryGraph() {
        const issues = [];
        const allNodes = Object.keys(this.storyGraph.nodes);
        
        // Check for orphaned nodes
        const referencedNodes = new Set();
        allNodes.forEach(nodeId => {
            const node = this.storyGraph.nodes[nodeId];
            if (node.choices) {
                node.choices.forEach(choice => {
                    if (choice.nextNode) {
                        referencedNodes.add(choice.nextNode);
                    }
                });
            }
        });
        
        // Add start node to referenced
        referencedNodes.add(this.storyGraph.startNode);
        
        const orphanedNodes = allNodes.filter(id => !referencedNodes.has(id));
        if (orphanedNodes.length > 0) {
            issues.push({
                type: 'orphaned_nodes',
                nodes: orphanedNodes,
                message: 'These nodes are not referenced by any choices'
            });
        }
        
        // Check for missing referenced nodes
        const missingNodes = Array.from(referencedNodes).filter(id => !allNodes.includes(id));
        if (missingNodes.length > 0) {
            issues.push({
                type: 'missing_nodes',
                nodes: missingNodes,
                message: 'These nodes are referenced but do not exist'
            });
        }
        
        // Check for dead ends (nodes with no choices that aren't endings)
        const deadEnds = allNodes.filter(nodeId => {
            const node = this.storyGraph.nodes[nodeId];
            return !node.choices && node.type !== 'ending';
        });
        
        if (deadEnds.length > 0) {
            issues.push({
                type: 'dead_ends',
                nodes: deadEnds,
                message: 'These nodes have no choices and are not marked as endings'
            });
        }
        
        return {
            isValid: issues.length === 0,
            issues
        };
    }
}