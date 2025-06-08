import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useLayoutEffect, useCallback } from 'react';
import styled from 'styled-components';
import '../styles/TreeStyles.css';

// Action types
const ACTION_TYPES = {
  STUDENT: 'STUDENT',
  AI: 'AI'
};

// Slideshow speed options in milliseconds
const SPEED_OPTIONS = {
  SLOW: 3000,
  MEDIUM: 2000,
  FAST: 1000
};

// Node types mapping
const getNodeTypeName = (type) => {
  switch (type) {
    case 'CLAIM':
      return '주장';
    case 'EVIDENCE':
      return '근거';
    case 'COUNTER':
      return '예상 반론';
    case 'QUESTION':
      return '예상 질문';
    case 'ANSWER':
      return '답변';
    default:
      return '노드';
  }
};

// CSS styles for the timeline navigation
const TreeContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const TimelineContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 12px 0;
  border-bottom: 1px solid #e9ecef;
`;

const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
`;

const SlideshowControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0.5rem;
  gap: 0.5rem;
`;

const ControlButton = styled.button`
  background-color: ${props => props.disabled ? '#e9ecef' : '#f8f9fa'};
  color: ${props => props.disabled ? '#adb5bd' : '#495057'};
  border: 1px solid ${props => props.disabled ? '#dee2e6' : '#ced4da'};
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-weight: 500;
  
  &:hover:not(:disabled) {
    background-color: #e9ecef;
  }
`;

const SlideshowButton = styled(ControlButton)`
  background-color: ${props => props.active ? '#0066cc' : '#f8f9fa'};
  color: ${props => props.active ? '#ffffff' : '#495057'};
  
  &:hover:not(:disabled) {
    background-color: ${props => props.active ? '#0056b3' : '#e9ecef'};
  }
`;

const SpeedButton = styled.button`
  background-color: ${props => props.active ? '#0066cc' : '#f8f9fa'};
  color: ${props => props.active ? '#ffffff' : '#495057'};
  border: 1px solid ${props => props.active ? '#0056b3' : '#ced4da'};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.active ? '#0056b3' : '#e9ecef'};
  }
`;

const ActivityInfo = styled.div`
  text-align: center;
  flex: 1;
  margin: 0 1rem;
`;

const ActivityTimestamp = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
`;

const ActivityDescription = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const ActivityProgress = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
`;

const Timeline = styled.div`
  position: relative;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  margin-top: 0.5rem;
`;

const TimelineLine = styled.div`
  position: absolute;
  left: 1.5rem;
  right: 1.5rem;
  height: 2px;
  background-color: #dee2e6;
  z-index: 1;
`;

const TimelinePoint = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => 
    props.isCurrent 
      ? '#0066cc' 
      : props.isStudent 
        ? '#6c757d' 
        : '#20c997'};
  border: 2px solid #fff;
  margin-right: ${props => props.last ? '0' : 'auto'};
  z-index: 2;
  cursor: pointer;
  position: relative;
  
  &:hover {
    transform: scale(1.3);
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.3);
  }
`;

const TimelineTooltip = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #212529;
  color: #fff;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  text-align: center;
  
  ${TimelinePoint}:hover & {
    opacity: 1;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #212529 transparent transparent transparent;
  }
`;

const TreeContent = styled.div`
  position: relative;
  margin: 10px 0; /* Reduced top margin */
  width: 100%;
  min-height: 800px; /* Minimum height for the tree */
  box-sizing: border-box;
  z-index: 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 0 1 auto; /* Don't grow beyond content */
`;

const Statistics = styled.div`
  margin-top: 40px; /* Space between tree and statistics */
  margin-bottom: 40px; /* Space at the bottom */
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  position: relative;
  z-index: 5;
  flex: 0 0 auto; /* Don't grow or shrink */
`;

const StatTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
`;

const StatItem = styled.div`
  background-color: white;
  padding: 0.75rem;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
`;

const StatValue = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #212529;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
  font-style: italic;
`;

// Position and reference types defined as proper interfaces

// Subject Node Component
const SubjectNode = forwardRef(({ content }, ref) => {
  return (
    <div ref={ref} className="tree__node tree__node--subject">
      <div className="tree__node__content_container">
        <div className="tree__node__title">주제</div>
        <div className="tree__node__content">{content}</div>
      </div>
    </div>
  );
});
SubjectNode.displayName = 'SubjectNode';

// Argument Node Component
const ArgumentNode = forwardRef(({ argNode, position, parentposition, childNodes }, ref) => {
  const elementRef = useRef(null);
  const childRefs = useRef([]);
  
  if (argNode.evidences) {
    childRefs.current = argNode.evidences.map(() => React.createRef());
  }
  
  // Get proper node type for styling - the node.type should already be 'argument' or 'counterargument'
  const nodeType = argNode.type; // The type is already converted in the renderableNodes creation
  const nodeTypeLabel = getNodeTypeName(argNode.type === 'argument' ? 'CLAIM' : 
                                        argNode.type === 'counterargument' ? 'COUNTER' : 
                                        argNode.type === 'question' ? 'QUESTION' : 'CLAIM');
  
  useImperativeHandle(ref, () => ({
    element: elementRef.current,
    getHeight: () => {
      if (elementRef.current) {
        return elementRef.current.offsetHeight;
      }
      return 0;
    },
    getEvidencePosition: (index) => {
      if (elementRef.current && childRefs.current[index]?.current) {
        const evidenceRect = childRefs.current[index].current.getBoundingClientRect();
        
        // Get the tree container to calculate relative positions
        const treeContainer = elementRef.current.closest('.tree');
        if (treeContainer) {
          const treeRect = treeContainer.getBoundingClientRect();
          return {
            x: evidenceRect.left - treeRect.left,
            y: evidenceRect.top - treeRect.top
          };
        }
      }
      return null;
    }
  }));
  
  return (
    <div 
      ref={elementRef} 
      className={`tree__node tree__node--${nodeType}`} 
      style={{ left: position.x, top: position.y }}
    >
      {parentposition && <div className="tree__node__link" style={{ height: `${Math.abs(parentposition.y - position.y)}px` }}></div>}
      <div className="tree__node__content_container">
        <div className="tree__node__title">{nodeTypeLabel}</div>
        <div className="tree__node__content">{argNode.summary || argNode.content}</div>
      </div>
      {argNode.evidences && argNode.evidences.length > 0 && (
        <div className="tree__node__children_container">
          {argNode.evidences.map((evidence, i) => (
            <div key={`evidence-${evidence.id}`}>
              <EvidenceNode
                ref={childRefs.current[i]}
                content={evidence.summary || evidence.content}
                index={i + 1}
              />
            </div>
          ))}
        </div>
      )}
      <div className="tree__node__btn"></div>
    </div>
  );
});
ArgumentNode.displayName = 'ArgumentNode';

// Evidence Node Component
const EvidenceNode = forwardRef(({ content, index }, ref) => {
  return (
    <div ref={ref} className="tree__node tree__node--evidence">
      <div className="tree__node__content_container">
        <div className="tree__node__title">{`근거 ${index}`}</div>
        <div className="tree__node__content">{content}</div>
      </div>
    </div>
  );
});
EvidenceNode.displayName = 'EvidenceNode';

// Question Node Component
const QuestionNode = forwardRef(({ qNode, position, parentposition }, ref) => {
  const elementRef = useRef(null);
  const childRefs = useRef([]);
  
  if (qNode.answers) {
    childRefs.current = qNode.answers.map(() => React.createRef());
  }
  
  useImperativeHandle(ref, () => ({
    element: elementRef.current,
    getHeight: () => {
      if (elementRef.current) {
        return elementRef.current.offsetHeight;
      }
      return 0;
    },
    getEvidencePosition: () => null
  }));
  
  return (
    <div 
      ref={elementRef} 
      className="tree__node tree__node--question" 
      style={{ left: position.x, top: position.y }}
    >
      {parentposition && <div className="tree__node__link" style={{ height: `${Math.abs(parentposition.y - position.y)}px` }}></div>}
      <div className="tree__node__content_container">
        <div className="tree__node__title">예상 질문</div>
        <div className="tree__node__content">{qNode.summary || qNode.content}</div>
      </div>
      {qNode.answers && qNode.answers.length > 0 && (
        <div className="tree__node__children_container">
          {qNode.answers.map((answer, i) => (
            <AnswerNode 
              key={`answer-${answer.id}`}
              ref={childRefs.current[i]} 
              content={answer.summary || answer.content} 
            />
          ))}
        </div>
      )}
      <div className="tree__node__btn"></div>
    </div>
  );
});
QuestionNode.displayName = 'QuestionNode';

// Answer Node Component
const AnswerNode = forwardRef(({ content }, ref) => {
  return (
    <div ref={ref} className="tree__node tree__node--answer">
      <div className="tree__node__content_container">
        <div className="tree__node__title">답변</div>
        <div className="tree__node__content">{content}</div>
      </div>
    </div>
  );
});
AnswerNode.displayName = 'AnswerNode';

// Connection Line Component for connecting evidence to counterarguments
const ConnectionLine = ({ from, to }) => {
  if (!from || !to) return null;
  
  // Calculate the connection line position and dimensions
  const startX = from.x + 438; // End of evidence node
  const startY = from.y + 20; // Middle of evidence node
  const endX = to.x; // Start of counterargument node
  const endY = to.y + 20; // Middle of counterargument node
  
  const width = endX - startX;
  
  // For horizontal line
  const lineStyle = {
    position: 'absolute',
    left: startX,
    top: startY,
    width: `${width}px`,
    height: '3px',
    backgroundColor: '#CC2A53', // Match counterargument color
    zIndex: 10
  };
  
  // For the circle at the start of the connection
  const circleStyle = {
    position: 'absolute',
    left: startX - 5,
    top: startY - 5,
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#CC2A53', // Match counterargument color
    zIndex: 10
  };
  
  // For the vertical connection from horizontal line to counterargument node
  const verticalLineStyle = {
    position: 'absolute',
    left: endX - 2, // Slightly adjust to align with node border
    top: Math.min(startY, endY), // Start from the higher point
    width: '3px',
    height: `${Math.abs(endY - startY)}px`,
    backgroundColor: '#CC2A53', // Match counterargument color
    zIndex: 10
  };
  
  return (
    <>
      <div style={circleStyle}></div>
      <div style={lineStyle}></div>
      {endY !== startY && <div style={verticalLineStyle}></div>}
    </>
  );
};

// Main StudentTreeProgress Component
const StudentTreeProgress = ({ treeLogData, fullPage }) => {
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [activities, setActivities] = useState([]);
  const [renderableNodes, setRenderableNodes] = useState([]);
  const [nodePositions, setNodePositions] = useState(new Map());
  const [connections, setConnections] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [slideshowSpeed, setSlideshowSpeed] = useState(SPEED_OPTIONS.MEDIUM);
  
  // Slideshow effect - advances timeline automatically when playing
  useEffect(() => {
    let slideshowTimer = null;
    
    if (isPlaying && activities.length > 0) {
      slideshowTimer = setTimeout(() => {
        if (currentTimeIndex < activities.length - 1) {
          setCurrentTimeIndex(currentTimeIndex + 1);
        } else {
          // Stop when we reach the end
          setIsPlaying(false);
        }
      }, slideshowSpeed);
    }
    
    return () => {
      if (slideshowTimer) {
        clearTimeout(slideshowTimer);
      }
    };
  }, [isPlaying, currentTimeIndex, activities.length, slideshowSpeed]);

  // Process tree log data
  useEffect(() => {
    if (!treeLogData || !treeLogData.activities) return;
    
    console.log("Raw tree log data:", treeLogData);
    
    // Sort activities by timestamp
    const sortedActivities = [...treeLogData.activities].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    setActivities(sortedActivities);
    
    if (sortedActivities.length > 0) {
      // Initially set to last activity (to see the final state), 
      // but the auto-start effect will reset to beginning
      setCurrentTimeIndex(sortedActivities.length - 1);
    }
  }, [treeLogData]);
  
  // Auto-start slideshow from the beginning when component mounts
  const autoStartRef = useRef(false);
  useEffect(() => {
    // Only auto-start once when activities are first loaded
    if (activities.length > 0 && !autoStartRef.current) {
      autoStartRef.current = true;
      
      // Set a short delay before starting to ensure the tree is properly rendered
      const timer = setTimeout(() => {
        setCurrentTimeIndex(0); // Start from the first step
        setIsPlaying(true);     // Begin auto-playing
      }, 1000); // 1 second delay for better user experience
      
      return () => clearTimeout(timer);
    }
  }, [activities]);
  
  // Start slideshow from the beginning
  const handleStartSlideshow = () => {
    setCurrentTimeIndex(0); // Reset to the beginning
    setIsPlaying(true);
  };
  
  // Toggle play/pause
  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Change slideshow speed
  const handleSpeedChange = (speed) => {
    setSlideshowSpeed(speed);
  };

  // Prepare renderable nodes based on current activities
  useEffect(() => {
    if (!activities || activities.length === 0) return;
    
    const visibleActivities = activities.slice(0, currentTimeIndex + 1);
    
    // Transform activities into renderable nodes
    const nodes = [];
    
    // Build a map of evidence IDs to their parent nodes and indices
    const evidenceMap = new Map();
    
    // First pass: collect all nodes and build evidence map
    visibleActivities.forEach((activity) => {
      if (!activity.node || activity.node.hidden) return;
      
      // Map evidences to their parent nodes for later lookup
      if (activity.evidences && activity.evidences.length > 0) {
        activity.evidences.forEach((evidence, index) => {
          evidenceMap.set(evidence.id, {
            parentNodeId: activity.node.id,
            index: index
          });
        });
      }
    });
    
    console.log('Evidence map:', evidenceMap);
    
    // Create a map to store each node by ID for easy lookup
    const nodeMap = new Map();
    
    // Second pass: create renderable nodes with proper connections
    visibleActivities.forEach((activity, index) => {
      if (!activity.node || activity.node.hidden) return;
      
      // Determine parent evidence info for counterarguments
      let parentEvidenceInfo = null;
      if (activity.node.type === 'COUNTER' && activity.node.triggeredByEvidenceId) {
        parentEvidenceInfo = evidenceMap.get(activity.node.triggeredByEvidenceId);
        console.log('Found parent evidence info for counter:', activity.node.id, parentEvidenceInfo);
      }
      
      // Create a node object
      const parentId = activity.node.parentId;
      
      // Prepare the node 
      const node = {
        id: activity.node.id,
        // Initial depth will be assigned later in the depth calculation step
        depth: parentId === null ? 0 : 1,
        node: { 
          ...activity.node,
          nodeId: activity.node.id,
          type: activity.node.type === 'CLAIM' ? 'argument' : 
                activity.node.type === 'COUNTER' ? 'counterargument' : 'question',
          evidences: activity.evidences || []
        },
        parentNodeId: parentId || 'subject',
        // For counterarguments, use the index from the evidence map
        parentEvidenceIndex: parentEvidenceInfo ? parentEvidenceInfo.index : undefined,
        // Store the actual evidence ID that triggered this counterargument
        triggeredByEvidenceId: activity.node.triggeredByEvidenceId
      };
      
      nodes.push(node);
      nodeMap.set(node.id, node);
    });
    
    // Calculate proper depths based on parent-child relationships
    // This ensures nodes are positioned at the right horizontal level
    const calculateProperDepth = (node, depth, visited = new Set()) => {
      if (visited.has(node.id)) return; // Prevent infinite loops
      visited.add(node.id);
      
      // Assign the current depth
      node.depth = depth;
      
      // Find children of this node
      nodes.forEach(childNode => {
        if (childNode.parentNodeId === node.id) {
          // For each child, calculate its depth as parent's depth + 1
          calculateProperDepth(childNode, depth + 1, visited);
        }
      });
      
      // Special handling for counterarguments that respond to evidence
      if (node.node.type === 'counterargument' && node.triggeredByEvidenceId) {
        // Find the parent node (argument) that contains the evidence
        const parentArgNode = nodes.find(n => 
          n.node.evidences && n.node.evidences.some(e => e.id === node.triggeredByEvidenceId)
        );
        
        if (parentArgNode) {
          // The counterargument should be positioned one level to the right of its parent
          node.depth = parentArgNode.depth + 1;
          
          // Store the parent node ID to establish the relationship
          node.respondingToNodeId = parentArgNode.id;
        }
      }
    };
    
    // Start calculating depths from root level nodes (with no parent)
    nodes.filter(n => n.parentNodeId === 'subject').forEach(rootNode => {
      calculateProperDepth(rootNode, 1, new Set());
    });
    
    console.log('Final renderable nodes with proper depths:', nodes);
    setRenderableNodes(nodes);
  }, [activities, currentTimeIndex]);
  
  // Reference tracking for nodes
  const nodeRefs = useRef(new Map());
  
  // Function to get or create a ref for a specific node
  const getNodeRef = useCallback((nodeId) => {
    if (!nodeRefs.current.has(nodeId)) {
      nodeRefs.current.set(nodeId, React.createRef());
    }
    return nodeRefs.current.get(nodeId);
  }, []);
  
  // Position calculation constants
  const positionorigin = { x: 8, y: 10 }; // Starting position for the subject node
  const nodeWidth = 462;
  const colGap = 32;
  const colWidth = nodeWidth + colGap;
  const rowGap = 10; // Increased row gap for better spacing
  const subjectHeight = 80; // Approximate height of subject node for spacing
  
  // Calculate positions for all nodes
  const calculatePositions = useCallback(() => {
    if (renderableNodes.length === 0) return;
    
    // Use a functional update to avoid dependency on nodePositions
    setNodePositions(prevPositions => {
      const newPositions = new Map(prevPositions);
      const depthYOffsets = new Map();
      
      // Initialize depth starting positions
      for (let depth = 0; depth <= Math.max(...renderableNodes.map(n => n.depth)); depth++) {
        depthYOffsets.set(depth, positionorigin.y);
      }
      
      // Process nodes in order (breadth-first by depth)
      const nodesByDepth = new Map();
      renderableNodes.forEach(node => {
        // Ensure proper depth assignment - all nodes of the same depth level should be in the same column
        const depth = node.depth;
        if (!nodesByDepth.has(depth)) {
          nodesByDepth.set(depth, []);
        }
        nodesByDepth.get(depth).push(node);
      });
      
  // Special handling for first level nodes - position them directly below the subject
  if (nodesByDepth.has(1)) {
    depthYOffsets.set(1, positionorigin.y + subjectHeight + 20); // Position first level nodes directly below subject with spacing
  }
      
      // Process each depth level
      Array.from(nodesByDepth.keys()).sort((a, b) => a - b).forEach(depth => {
        const nodesAtDepth = nodesByDepth.get(depth);
        
        nodesAtDepth.forEach(nodeData => {
          // Calculate x position based on depth and parent-child relationships
          let x;
          
          // If this is a first level node (direct child of subject), place it directly below the subject
          if (nodeData.parentNodeId === 'subject') {
            x = positionorigin.x; // Same x-coordinate as subject
          } else if (nodeData.depth > 1) {
            // For nodes at deeper levels, use the standard indentation
            x = positionorigin.x + (colWidth * (nodeData.depth - 1));
          } else {
            // Default horizontal positioning
            x = positionorigin.x + (colWidth * nodeData.depth);
          }
          
          let y;
          
          // If this node has a parent, start at parent's y position or parent's evidence position
          if (nodeData.parentNodeId && nodeData.parentNodeId !== 'subject' && 
              (nodeData.triggeredByEvidenceId || nodeData.parentEvidenceIndex !== undefined)) {
            
            // Find the parent node
            const parentNode = renderableNodes.find(n => n.id === nodeData.parentNodeId);
            
            if (parentNode) {
              const parentRef = getNodeRef(parentNode.id);
              const parentPos = prevPositions.get(parentNode.id);
              
              // If we have the parent's position and reference
              if (parentRef.current && parentPos) {
                // Get position based on specific evidence if this is a response to an evidence
                if (nodeData.triggeredByEvidenceId) {
                  // Find the index of the evidence in the parent's evidences array
                  const evidenceIndex = parentNode.node.evidences?.findIndex(e => e.id === nodeData.triggeredByEvidenceId);
                  
                  if (evidenceIndex !== undefined && evidenceIndex >= 0) {
                    const evidencePosition = parentRef.current.getEvidencePosition(evidenceIndex);
                    if (evidencePosition) {
                      // Start at evidence node's y position
                      y = evidencePosition.y;
                    } else {
                      y = parentPos.y; // Fallback to parent's y position
                    }
                  } else {
                    y = parentPos.y; // Fallback to parent's y position
                  }
                } 
                // If we have a specific parentEvidenceIndex, use that
                else if (nodeData.parentEvidenceIndex !== undefined) {
                  const evidencePosition = parentRef.current.getEvidencePosition(nodeData.parentEvidenceIndex);
                  if (evidencePosition) {
                    y = evidencePosition.y;
                  } else {
                    y = parentPos.y; // Fallback to parent's y position
                  }
                } else {
                  y = parentPos.y; // Fallback to parent's y position
                }
                
                // Check if this position would overlap with existing nodes at the same depth
                const currentDepthY = depthYOffsets.get(nodeData.depth);
                y = Math.max(y, currentDepthY);
              } else {
                // If parent reference or position isn't available yet, use the depth offset
                y = depthYOffsets.get(nodeData.depth);
              }
            } else {
              // If parent node isn't found, use the depth offset
              y = depthYOffsets.get(nodeData.depth);
            }
          } else {
            // Root level nodes or nodes without parents
            y = depthYOffsets.get(nodeData.depth);
          }
          
          newPositions.set(nodeData.id, { x, y });
          
          // Update the y offset for this depth to ensure siblings don't overlap
          const nodeRef = getNodeRef(nodeData.id);
          const nodeHeight = nodeRef.current?.getHeight() || 200; // Fallback height
          depthYOffsets.set(nodeData.depth, y + nodeHeight + rowGap);
        });
      });
      
      return newPositions;
    });
  }, [renderableNodes, positionorigin.x, positionorigin.y, colWidth, rowGap, getNodeRef]);
  
  // Calculate positions after nodes are collected and rendered
  useLayoutEffect(() => {
    if (renderableNodes.length > 0) {
      const timeoutId = setTimeout(calculatePositions, 10);
      return () => clearTimeout(timeoutId);
    }
  }, [renderableNodes, calculatePositions]);
  
  // Recalculate positions when node refs are updated
  const nodeHeights = renderableNodes.map(n => getNodeRef(n.id).current?.getHeight()).join(',');
  useLayoutEffect(() => {
    calculatePositions();
  }, [nodeHeights, calculatePositions]);
  
  // Calculate and update connections between evidence and counterargument nodes
  useEffect(() => {
    if (renderableNodes.length === 0 || nodePositions.size === 0) return;
    
    console.log('Calculating connections for nodes:', renderableNodes);
    setConnections([]); // Clear existing connections
    
    // Find all counterargument nodes with triggeredByEvidenceId
    const counterargNodes = renderableNodes.filter(node => 
      node.node.type === 'counterargument' && 
      node.triggeredByEvidenceId !== undefined
    );
    
    console.log('Found counterargument nodes with triggeredByEvidenceId:', counterargNodes);
    
    // For each counterargument, find its parent evidence position
    setTimeout(() => {
      const newConnections = [];
      
      counterargNodes.forEach(counterNode => {
        console.log('Processing counterargument node:', counterNode);
        
        // Find the parent node that contains the evidence this counterargument responds to
        const parentNode = renderableNodes.find(n => 
          n.node.evidences && 
          n.node.evidences.some(e => e.id === counterNode.triggeredByEvidenceId)
        );
        
        if (!parentNode) {
          console.log('Parent node containing evidence not found for counterargument:', counterNode.id);
          return;
        }
        
        console.log('Found parent node with evidence:', parentNode);
        
        // Find the index of the evidence in the parent node's evidences array
        const evidenceIndex = parentNode.node.evidences.findIndex(e => e.id === counterNode.triggeredByEvidenceId);
        if (evidenceIndex === -1) {
          console.log('Evidence not found in parent node:', counterNode.triggeredByEvidenceId);
          return;
        }
        
        const parentRef = getNodeRef(parentNode.id);
        const parentPos = nodePositions.get(parentNode.id);
        const counterPos = nodePositions.get(counterNode.id);
        
        if (!parentRef.current || !parentPos || !counterPos) {
          console.log('Parent ref, parent position or counter position not available');
          return;
        }
        
        // Get the evidence position using the parent node's ref
        console.log('Getting evidence position for index:', evidenceIndex);
        const evidencePos = parentRef.current.getEvidencePosition(evidenceIndex);
        
        console.log('Evidence position:', evidencePos);
        console.log('Counter position:', counterPos);
        
        if (evidencePos) {
          console.log('Creating connection from evidence to counterargument');
          newConnections.push({
            from: evidencePos, // Use the exact evidence position
            to: counterPos
          });
        }
      });
      
      console.log('Final connections:', newConnections);
      if (newConnections.length > 0) {
        setConnections(newConnections);
      }
    }, 500); // Add a delay to ensure DOM is fully rendered
    
  }, [renderableNodes, nodePositions, getNodeRef]);
  
  // Timeline navigation functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleTimelineChange = (index) => {
    // Pause slideshow if user manually changes timeline
    setIsPlaying(false);
    setCurrentTimeIndex(index);
  };

  const handlePrevState = () => {
    // Pause slideshow if user manually navigates
    setIsPlaying(false);
    if (currentTimeIndex > 0) {
      setCurrentTimeIndex(currentTimeIndex - 1);
    }
  };

  const handleNextState = () => {
    // Pause slideshow if user manually navigates
    setIsPlaying(false);
    if (currentTimeIndex < activities.length - 1) {
      setCurrentTimeIndex(currentTimeIndex + 1);
    }
  };

  const getActivityDescription = (activity) => {
    if (!activity || !activity.node) return '';

    const actionByText = activity.actionBy === ACTION_TYPES.STUDENT ? '학생' : 'AI';
    const nodeTypeText = getNodeTypeName(activity.node.type);
    
    return `${actionByText}이(가) ${nodeTypeText}를 추가했습니다`;
  };

  if (!treeLogData || !activities || activities.length === 0) {
    return <EmptyMessage>트리 데이터가 없습니다.</EmptyMessage>;
  }

  const currentActivity = activities[currentTimeIndex];
  
  return (
    <TreeContainer className={fullPage ? 'full-page' : ''}>
      <TimelineContainer>
        <Controls>
          <ControlButton onClick={handlePrevState} disabled={currentTimeIndex === 0 || isPlaying}>
            &lt; 이전
          </ControlButton>
          <ActivityInfo>
            <ActivityTimestamp>{formatDate(currentActivity.timestamp)}</ActivityTimestamp>
            <ActivityDescription>{getActivityDescription(currentActivity)}</ActivityDescription>
            <ActivityProgress>
              {currentTimeIndex + 1} / {activities.length}
            </ActivityProgress>
          </ActivityInfo>
          <ControlButton onClick={handleNextState} disabled={currentTimeIndex === activities.length - 1 || isPlaying}>
            다음 &gt;
          </ControlButton>
        </Controls>
        
        <SlideshowControls>
          <SlideshowButton onClick={handleStartSlideshow} disabled={isPlaying}>
            처음부터 시작
          </SlideshowButton>
          <SlideshowButton onClick={handleTogglePlay} active={isPlaying}>
            {isPlaying ? '일시정지' : '재생'}
          </SlideshowButton>
          <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>속도:</span>
            <SpeedButton 
              active={slideshowSpeed === SPEED_OPTIONS.SLOW} 
              onClick={() => handleSpeedChange(SPEED_OPTIONS.SLOW)}
            >
              느림
            </SpeedButton>
            <SpeedButton 
              active={slideshowSpeed === SPEED_OPTIONS.MEDIUM} 
              onClick={() => handleSpeedChange(SPEED_OPTIONS.MEDIUM)}
            >
              보통
            </SpeedButton>
            <SpeedButton 
              active={slideshowSpeed === SPEED_OPTIONS.FAST} 
              onClick={() => handleSpeedChange(SPEED_OPTIONS.FAST)}
            >
              빠름
            </SpeedButton>
          </div>
        </SlideshowControls>
        
        <Timeline>
          <TimelineLine />
          {activities.map((activity, index) => (
            <TimelinePoint 
              key={index}
              isCurrent={index === currentTimeIndex}
              isStudent={activity.actionBy === ACTION_TYPES.STUDENT}
              onClick={() => handleTimelineChange(index)}
            >
              <TimelineTooltip>
                {formatDate(activity.timestamp)}<br/>
                {activity.actionBy === ACTION_TYPES.STUDENT ? '학생' : 'AI'} 활동
              </TimelineTooltip>
            </TimelinePoint>
          ))}
        </Timeline>
      </TimelineContainer>
      
      <TreeContent>
        <div className="tree">
          {/* Subject Node - Always visible */}
          <SubjectNode 
            content={treeLogData.assignment.title || treeLogData.assignment.chapter || "인구 변화와 사회 문제"} 
          />
          {/* Render connection lines between evidence and counterarguments */}
          {connections.map((connection, index) => (
            <ConnectionLine key={`connection-${index}`} from={connection.from} to={connection.to} />
          ))}
          
          {/* Render nodes based on their type */}
          {renderableNodes.map((nodeData) => {
            const position = nodePositions.get(nodeData.id) || { 
              x: positionorigin.x + (colWidth * nodeData.depth), 
              y: positionorigin.y + (nodeData.depth * 200) 
            };
            
            // Determine parent evidence position if parent exists
            let parentEvidencePosition = undefined;
            
            // Only set parentEvidencePosition for nodes that should have vertical connection lines
            // For counterargument nodes, we handle these with the ConnectionLine component instead
            if (nodeData.node.type !== 'counterargument' && nodeData.parentNodeId && nodeData.parentNodeId !== 'subject' && nodeData.parentEvidenceIndex !== undefined) {
              const parentNode = renderableNodes.find(n => n.id === nodeData.parentNodeId);
              if (parentNode) {
                const parentRef = getNodeRef(parentNode.id);
                parentEvidencePosition = parentRef.current?.getEvidencePosition(nodeData.parentEvidenceIndex) || undefined;
              }
            }
            
            if (nodeData.node.type === 'question') {
              return (
                <QuestionNode
                  key={nodeData.id}
                  ref={getNodeRef(nodeData.id)}
                  qNode={nodeData.node}
                  position={position}
                  parentposition={parentEvidencePosition}
                />
              );
            } else {
              return (
                <ArgumentNode
                  key={nodeData.id}
                  ref={getNodeRef(nodeData.id)}
                  argNode={nodeData.node}
                  position={position}
                  parentposition={parentEvidencePosition}
                  childNodes={nodeData.children}
                />
              );
            }
          })}
        </div>
      </TreeContent>
      
      {/* Move statistics after the tree content with clear separation */}
      <Statistics>
        <StatTitle>통계</StatTitle>
        {treeLogData.statistics && (
          <StatGrid>
            <StatItem>
              <StatLabel>총 노드 수</StatLabel>
              <StatValue>{treeLogData.statistics.totalNodes}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>학생 노드</StatLabel>
              <StatValue>{treeLogData.statistics.studentNodes}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>AI 노드</StatLabel>
              <StatValue>{treeLogData.statistics.aiNodes}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>총 근거 수</StatLabel>
              <StatValue>{treeLogData.statistics.totalEvidences}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>총 활동 기간</StatLabel>
              <StatValue>{treeLogData.statistics.totalDuration}</StatValue>
            </StatItem>
          </StatGrid>
        )}
      </Statistics>
    </TreeContainer>
  );
};

export default StudentTreeProgress;