import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useLayoutEffect, useCallback } from 'react';
import styled from 'styled-components';
import '../styles/TreeStyles.css';

// Action types
const ACTION_TYPES = {
  STUDENT: 'STUDENT',
  AI: 'AI'
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
  margin: 20px 0;
  width: 100%;
  min-height: 600px;
  box-sizing: border-box;
  z-index: 0;
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Statistics = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
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

// Position type for node positioning
const Position = {
  x: 0,
  y: 0
};

// Reference type for node references
const NodeRef = {
  element: null,
  getHeight: () => 0,
  getEvidencePosition: (index) => null
};

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

// Main StudentTreeProgress Component
const StudentTreeProgress = ({ treeLogData, fullPage }) => {
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [activities, setActivities] = useState([]);
  const [renderableNodes, setRenderableNodes] = useState([]);
  const [nodePositions, setNodePositions] = useState(new Map());
  
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
      setCurrentTimeIndex(sortedActivities.length - 1);
    }
  }, [treeLogData]);
  
  // Prepare renderable nodes based on current activities
  useEffect(() => {
    if (!activities || activities.length === 0) return;
    
    const visibleActivities = activities.slice(0, currentTimeIndex + 1);
    
    // Transform activities into renderable nodes
    const nodes = [];
    
    // Add nodes from visible activities
    visibleActivities.forEach((activity, index) => {
      if (!activity.node || activity.node.hidden) return;
      
      // Create a node object
      const node = {
        id: activity.node.id,
        depth: activity.node.parentId === null ? 0 : 1,
        node: { 
          ...activity.node,
          nodeId: activity.node.id,
          type: activity.node.type === 'CLAIM' ? 'argument' : 
                activity.node.type === 'COUNTER' ? 'counterargument' : 'question',
          evidences: activity.evidences || []
        },
        parentNodeId: activity.node.parentId || 'subject',
        parentEvidenceIndex: activity.node.parentEvidenceIndex
      };
      
      nodes.push(node);
    });
    
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
  const positionorigin = { x: 8, y: 90 };
  const nodeWidth = 462;
  const colGap = 32;
  const colWidth = nodeWidth + colGap;
  const rowGap = 12;
  
  // Calculate positions for all nodes
  const calculatePositions = useCallback(() => {
    if (renderableNodes.length === 0) return;
    
    const newPositions = new Map();
    const depthYOffsets = new Map();
    
    // Initialize depth starting positions
    for (let depth = 0; depth <= Math.max(...renderableNodes.map(n => n.depth)); depth++) {
      depthYOffsets.set(depth, positionorigin.y);
    }
    
    // Process nodes in order (breadth-first by depth)
    const nodesByDepth = new Map();
    renderableNodes.forEach(node => {
      if (!nodesByDepth.has(node.depth)) {
        nodesByDepth.set(node.depth, []);
      }
      nodesByDepth.get(node.depth).push(node);
    });
    
    // Process each depth level
    Array.from(nodesByDepth.keys()).sort((a, b) => a - b).forEach(depth => {
      const nodesAtDepth = nodesByDepth.get(depth);
      
      nodesAtDepth.forEach(nodeData => {
        const x = positionorigin.x + (colWidth * nodeData.depth);
        let y = depthYOffsets.get(nodeData.depth);
        
        newPositions.set(nodeData.id, { x, y });
        
        // Update the y offset for this depth to ensure siblings don't overlap
        const nodeRef = getNodeRef(nodeData.id);
        const nodeHeight = nodeRef.current?.getHeight() || 200; // Fallback height
        depthYOffsets.set(nodeData.depth, y + nodeHeight + rowGap);
      });
    });
    
    setNodePositions(newPositions);
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
    setCurrentTimeIndex(index);
  };

  const handlePrevState = () => {
    if (currentTimeIndex > 0) {
      setCurrentTimeIndex(currentTimeIndex - 1);
    }
  };

  const handleNextState = () => {
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
          <ControlButton onClick={handlePrevState} disabled={currentTimeIndex === 0}>
            &lt; 이전
          </ControlButton>
          <ActivityInfo>
            <ActivityTimestamp>{formatDate(currentActivity.timestamp)}</ActivityTimestamp>
            <ActivityDescription>{getActivityDescription(currentActivity)}</ActivityDescription>
            <ActivityProgress>
              {currentTimeIndex + 1} / {activities.length}
            </ActivityProgress>
          </ActivityInfo>
          <ControlButton onClick={handleNextState} disabled={currentTimeIndex === activities.length - 1}>
            다음 &gt;
          </ControlButton>
        </Controls>
        
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
          
          {/* Render nodes based on their type */}
          {renderableNodes.map((nodeData) => {
            const position = nodePositions.get(nodeData.id) || { 
              x: positionorigin.x + (colWidth * nodeData.depth), 
              y: positionorigin.y + (nodeData.depth * 200) 
            };
            
            // Determine parent evidence position if parent exists
            let parentEvidencePosition = undefined;
            if (nodeData.parentNodeId && nodeData.parentNodeId !== 'subject' && nodeData.parentEvidenceIndex !== undefined) {
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