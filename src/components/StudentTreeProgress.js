import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useLayoutEffect, useCallback } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { loadChatMessages as supabaseLoadChatMessages } from '../services/supabase';
// Node Detail Panel component
const NodeDetailPanel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 50%;
  height: 100vh;
  background-color: white;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateX(${props => props.isOpen ? '0' : '100%'});
  transition: transform 0.3s ease-in-out;
`;

const PanelHeader = styled.div`
  padding: 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6c757d;
  
  &:hover {
    color: #212529;
  }
`;

const PanelContent = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NodeContent = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const NodeTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #495057;
`;

const NodeText = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
`;

const EvidenceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const EvidenceItem = styled.div`
  background-color: white;
  border: 1px solid #e9ecef;
  border-left: 3px solid #3E935C;
  border-radius: 4px;
  padding: 0.75rem;
`;

const EvidenceTitle = styled.h5`
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #3E935C;
`;

const EvidenceText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
`;

const EvidenceSource = styled.div`
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e9ecef;
  font-size: 0.75rem;
  color: #6c757d;
`;

const EvidenceLink = styled.a`
  color: #0066cc;
  text-decoration: none;
  margin-left: 0.25rem;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ChatHistorySection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ChatHistoryTitle = styled.h4`
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #495057;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.5rem;
`;

const ChatHistoryList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ChatMessageItem = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  max-width: 80%;
  margin-bottom: 0.5rem;
  
  ${props => props.sender === 'USER' ? `
    align-self: flex-end;
    background-color: #e9f5ff;
    border: 1px solid #cce5ff;
  ` : `
    align-self: flex-start;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
  `}
`;

const ChatMessageText = styled.div`
  font-size: 0.875rem;
  line-height: 1.4;
`;

const ChatMessageTime = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
  text-align: right;
`;

const LoadingSpinner = styled.div`
  width: 2rem;
  height: 2rem;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  margin: 2rem auto;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyChatMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 90;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

// Interface for chat messages (structure reference only)
// eslint-disable-next-line no-unused-vars
const ChatMessage = {
  id: '',
  assignment_id: '',
  parent_node_id: '',
  node_id: '',
  sender: '', // 'USER' or 'AI'
  message: '',
  created_at: '',
  mode: '', // 'ask' or 'create'
  user_id: '',
  user_name: '',
  suggestions: [],
  citations: []
};

// Creator types
const CREATOR_TYPES = {
  STUDENT: 'STUDENT',
  AI: 'AI',
  TEACHER: 'TEACHER'
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
    case 'SUBJECT':
      return '주제';
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

// CSS styles for the tree and timeline navigation
const TreeContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  overflow: auto;
  display: flex;
  flex-direction: ${props => props.fullPage ? 'row' : 'column'};
  flex: 1;
`;

const TreeHeader = styled.div`
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  width: 100%;
`;

const AssignmentTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
`;

const StudentInfo = styled.div`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #495057;
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

const StatsToggleButton = styled.button`
  background-color: ${props => props.active ? '#0066cc' : '#f8f9fa'};
  color: ${props => props.active ? '#ffffff' : '#495057'};
  border: 1px solid ${props => props.active ? '#0056b3' : '#ced4da'};
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  
  &:hover {
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
  width: 100%; /* Always use full width */
  min-height: 800px; /* Minimum height for the tree */
  box-sizing: border-box;
  z-index: 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 0 1 auto; /* Don't grow beyond content */
`;

// Statistics Popup Styling
const StatisticsPopup = styled.div`
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 101;
  display: ${props => props.isOpen ? 'block' : 'none'};
  animation: slideDown 0.3s ease-in-out;
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
`;

// Statistics Section Styling
const Statistics = styled.div`
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 12px;
  animation: fadeIn 0.3s ease-in-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Statistics Popup Header
const StatisticsHeader = styled.div`
  padding: 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px 12px 0 0;
`;

const StatisticsTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
`;

const StatTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #212529;
  display: flex;
  align-items: center;
  
  &::before {
    content: "";
    display: inline-block;
    width: 24px;
    height: 24px;
    margin-right: 8px;
    background-color: #212529;
    mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 12a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H5zm10-8a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-4zm-5 4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-4z"/></svg>');
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: contain;
  }
`;

const StatCategories = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const StatCategory = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StatCategoryTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
`;

const StatItem = styled.div`
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  border-left: 3px solid ${props => props.color || '#212529'};
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #212529;
`;

const ContributionBar = styled.div`
  margin-top: 1rem;
  height: 8px;
  width: 100%;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const StudentContribution = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${props => props.percentage}%;
  background-color: #6c757d;
  border-radius: 4px 0 0 4px;
`;

const AIContribution = styled.div`
  position: absolute;
  left: ${props => props.studentPercentage}%;
  top: 0;
  height: 100%;
  width: ${props => props.percentage}%;
  background-color: #20c997;
  border-radius: ${props => props.studentPercentage > 0 ? '0 4px 4px 0' : '4px'};
`;

const ContributionLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #6c757d;
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background-color: ${props => props.color};
`;

const StatSummary = styled.div`
  background-color: #f0f0f0;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
`;

const SummaryItem = styled.div`
  text-align: center;
`;

const SummaryLabel = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 4px;
`;

const SummaryValue = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.color || '#212529'};
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
const ArgumentNode = forwardRef(({ argNode, position, parentposition, childNodes, nodeData, onNodeClick }, ref) => {
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
  
  // Handle node button click
  const handleButtonClick = (e) => {
    e.stopPropagation(); // Prevent any parent events
    if (onNodeClick) {
      onNodeClick(nodeData);
    }
  };
  
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
      {/* Always render connection line for non-root nodes */}
      {(parentposition || nodeType === 'counterargument' || nodeData?.parentNodeId !== 'subject') && (
        <div 
          className="tree__node__link" 
          style={{ 
            height: `${parentposition ? Math.abs(parentposition.y - position.y) : 60}px`,
            backgroundColor: nodeType === 'counterargument' ? '#CC2A53' : '#3E935C' 
          }}
        ></div>
      )}
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
      <div className="tree__node__btn" onClick={handleButtonClick}></div>
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
const QuestionNode = forwardRef(({ qNode, position, parentposition, nodeData, onNodeClick }, ref) => {
  const elementRef = useRef(null);
  const childRefs = useRef([]);
  
  if (qNode.answers) {
    childRefs.current = qNode.answers.map(() => React.createRef());
  }
  
  // Handle node button click
  const handleButtonClick = (e) => {
    e.stopPropagation(); // Prevent any parent events
    if (onNodeClick) {
      onNodeClick(nodeData);
    }
  };
  
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
      {/* Always render connection line for non-root nodes - same approach as ArgumentNode */}
      {(parentposition || nodeData?.parentNodeId !== 'subject') && (
        <div 
          className="tree__node__link" 
          style={{ 
            height: `${parentposition ? Math.abs(parentposition.y - position.y) : 60}px`,
            backgroundColor: '#385FA2' // Use standard blue for question nodes to match with app's blue color
          }}
        ></div>
      )}
      <div className="tree__node__content_container">
        <div className="tree__node__title">예상 질문</div>
        <div className="tree__node__content">{qNode.summary || qNode.content}</div>
      </div>
      {(qNode.children && qNode.children.length > 0) && (
        <div className="tree__node__children_container">
          {qNode.children.map((child, i) => (
            <AnswerNode 
              key={`answer-${child.id}`}
              ref={childRefs.current[i]} 
              content={child.summary || child.content} 
            />
          ))}
        </div>
      )}
      <div className="tree__node__btn" onClick={handleButtonClick}></div>
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

// All connection styling is handled through CSS in TreeStyles.css

// NodeDetailPanel Component
const NodeDetailPanelComponent = ({ 
  isOpen, 
  onClose, 
  selectedNode, 
  assignment,
  student,
  chatMessages, 
  loading 
}) => {
  if (!selectedNode) return null;

  const nodeType = selectedNode.node.type;
  const nodeTypeLabel = getNodeTypeName(
    nodeType === 'argument' ? 'CLAIM' : 
    nodeType === 'counterargument' ? 'COUNTER' : 
    nodeType === 'question' ? 'QUESTION' : 'CLAIM'
  );

  return (
    <>
      <Overlay isOpen={isOpen} onClick={onClose} />
      <NodeDetailPanel isOpen={isOpen}>
        <PanelHeader>
          <PanelTitle>{nodeTypeLabel} 상세</PanelTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </PanelHeader>
        <PanelContent>
          <NodeContent>
            <NodeTitle>{nodeTypeLabel}</NodeTitle>
            <NodeText>{selectedNode.node.content}</NodeText>
            
            {selectedNode.node.evidences && selectedNode.node.evidences.length > 0 && (
              <EvidenceList>
                {selectedNode.node.evidences.map((evidence, index) => (
                  <EvidenceItem key={evidence.id}>
                    <EvidenceTitle>근거 {index + 1}</EvidenceTitle>
                    <EvidenceText>{evidence.content}</EvidenceText>
                    {evidence.url && (
                      <EvidenceSource>
                        출처:
                        <EvidenceLink 
                          href={evidence.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {`[${index + 1}]`}
                        </EvidenceLink>
                      </EvidenceSource>
                    )}
                  </EvidenceItem>
                ))}
              </EvidenceList>
            )}
          </NodeContent>
          
          <ChatHistorySection>
          <ChatHistoryTitle>
            채팅 이력
            {chatMessages.length > 0 && chatMessages[0].id?.includes('mock') && (
              <span style={{ 
                fontSize: '0.7rem', 
                backgroundColor: '#ffe8e8', 
                color: '#e74c3c', 
                padding: '2px 6px', 
                borderRadius: '4px', 
                marginLeft: '8px',
                verticalAlign: 'middle'
              }}>
                테스트 데이터
              </span>
            )}
          </ChatHistoryTitle>
            <ChatHistoryList>
              {loading ? (
                <LoadingSpinner />
              ) : chatMessages.length > 0 ? (
                chatMessages.map((message, index) => (
                  <ChatMessageItem key={index} sender={message.sender}>
                    <ChatMessageText>
                      <ReactMarkdown>{message.message}</ReactMarkdown>
                    </ChatMessageText>
                    <ChatMessageTime>
                      {new Date(message.created_at).toLocaleString('ko-KR')}
                    </ChatMessageTime>
                  </ChatMessageItem>
                ))
              ) : (
                <EmptyChatMessage>
                  이 노드에 대한 채팅 이력이 없습니다.
                </EmptyChatMessage>
              )}
            </ChatHistoryList>
          </ChatHistorySection>
        </PanelContent>
      </NodeDetailPanel>
    </>
  );
};

// Main StudentTreeProgress Component
const StudentTreeProgress = ({ treeLogData, fullPage, showStatistics: initialShowStatistics = false, hideNodeTypesSection = false }) => {
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [activities, setActivities] = useState([]);
  const [renderableNodes, setRenderableNodes] = useState([]);
  const [nodePositions, setNodePositions] = useState(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const [slideshowSpeed, setSlideshowSpeed] = useState(SPEED_OPTIONS.MEDIUM);
  
  // State for node detail panel
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Internal state for statistics visibility - initialize as false by default
  const [internalShowStatistics, setInternalShowStatistics] = useState(initialShowStatistics);
  
  // Combine prop and internal state for determining if statistics should be shown
  const effectiveShowStatistics = internalShowStatistics;
  
  // Toggle statistics visibility
  const toggleStatistics = () => {
    setInternalShowStatistics(!internalShowStatistics);
  };
  
  // Close the statistics popup
  const closeStatistics = () => {
    setInternalShowStatistics(false);
  };


  // Log component initialization
  useEffect(() => {
    console.log('📋 StudentTreeProgress component initialized');
  }, []);
  
  // Handle node button click
  const handleNodeClick = async (nodeData) => {
    console.log('+ BUTTON CLICKED:', nodeData);
    
    setSelectedNode(nodeData);
    setIsDetailPanelOpen(true);
    
    // Still show the panel even if we don't have all data
    if (!nodeData) {
      console.error('Missing node data for loading chat messages');
      return;
    }
    
    setLoadingMessages(true);
    
    try {
      // Get assignment ID - handle different possible data structures
      let assignmentId;
      
      // Try different paths to find the assignment ID
      if (treeLogData?.data?.assignment?.id) {
        assignmentId = treeLogData.data.assignment.id.toString();
      } else if (treeLogData?.assignment?.id) {
        assignmentId = treeLogData.assignment.id.toString();
      } else if (treeLogData?.id) {
        assignmentId = treeLogData.id.toString();
      } else if (typeof treeLogData === 'object' && treeLogData !== null) {
        // Log the structure to help debug
        console.log('TreeLogData structure:', JSON.stringify(treeLogData, null, 2).substring(0, 200) + '...');
      }

      // If no assignment ID is available, we can't load messages
      if (!assignmentId) {
        console.error('No assignment ID available. TreeLogData:', treeLogData);
        setChatMessages([]);
        return;
      }
      
      const nodeId = nodeData.id.toString();
      const parentNodeId = (nodeData.parentNodeId || '0').toString();
      
      console.log('Loading chat messages with parameters:', { 
        assignmentId, 
        parentNodeId, 
        nodeId
      });
      
      // Use the simplified supabase service function
      const result = await supabaseLoadChatMessages(
        assignmentId, 
        parentNodeId, 
        nodeId
      );
      
      console.log('🔵 Chat messages load result:', {
        success: result.success,
        messageCount: result.data?.length || 0,
        isMock: result.mock || false
      });
      
      if (result.success && result.data) {
        // If we got mock data, log it
        if (result.mock) {
          console.log('ℹ️ Using mock chat messages (network request simulated)');
        }
        
        console.log('🟢 Loaded chat messages:', result.data.length);
        setChatMessages(result.data);
      } else if (result.error) {
        throw result.error;
      } else {
        console.log('No chat messages found for this node.');
        
        // Generate fallback messages - though this case should not happen
        // with our new mock implementation
        const fallbackMessages = [
          {
            id: `fallback-1-${nodeId}`,
            sender: 'USER',
            message: '학생: 채팅 내용을 불러오는 중 오류가 발생했습니다.',
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: `fallback-2-${nodeId}`,
            sender: 'AI',
            message: 'AI: 잠시 후 다시 시도해 주세요.',
            created_at: new Date(Date.now() - 3500000).toISOString()
          }
        ];
        
        console.log('⚠️ Using fallback messages');
        setChatMessages(fallbackMessages);
      }
    } catch (error) {
      console.error('❌ Exception loading chat messages:', error);
      
      // Provide fallback messages in case of unexpected errors
      const fallbackMessages = [
        {
          id: `error-1-${Date.now()}`,
          sender: 'USER',
          message: '학생: 데이터를 가져오는 중 오류가 발생했지만, 이렇게 채팅 내용이 표시됩니다.',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: `error-2-${Date.now()}`,
          sender: 'AI',
          message: 'AI: 현재 임시 데이터를 보여드리고 있습니다.',
          created_at: new Date(Date.now() - 3500000).toISOString()
        }
      ];
      setChatMessages(fallbackMessages);
    } finally {
      setLoadingMessages(false);
    }
  };
  
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
    if (!treeLogData) return;
    
    console.log("Raw tree log data:", treeLogData);
    
    // Determine the actual tree data structure based on API response format
    const treeData = treeLogData.data ? treeLogData : { data: treeLogData };
    
    // For the new data structure, we need to create activities from the tree structure
    // by traversing the nodes and creating an activity for each node
    const extractActivities = (node, parentId = null, parentType = null) => {
      const activities = [];
      
      if (!node) return activities;
      
      // Skip adding answer nodes as separate activities when they're children of question nodes
      // These are already rendered as part of the question node's children
      const isAnswerToQuestion = parentType === 'QUESTION' && node.type === 'ANSWER';
      
      // Create an activity for the current node (unless it's an answer to a question)
      if (node.id !== 0 && !isAnswerToQuestion) { // Skip the root subject node and answer nodes
        activities.push({
          node: {
            ...node,
            parentId: parentId,
            nodeId: node.id,
            type: node.type,
          },
          evidences: node.evidences || [],
          actionBy: node.createdBy === 'STUDENT' ? CREATOR_TYPES.STUDENT : 
                    node.createdBy === 'AI' ? CREATOR_TYPES.AI : CREATOR_TYPES.TEACHER,
          timestamp: node.createdAt
        });
      }
      
      // Add activities for all children recursively
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          // Pass current node's type as parentType to children
          activities.push(...extractActivities(child, node.id, node.type));
        });
      }
      
      return activities;
    };
    
    // Extract activities from the tree structure
    let allActivities = [];
    if (treeData.data && treeData.data.treeStructure) {
      console.log("Extracting activities from tree structure:", treeData.data.treeStructure);
      allActivities = extractActivities(treeData.data.treeStructure, null, null);
    }
    
    console.log("Extracted activities:", allActivities);
    
    // Sort activities by timestamp
    const sortedActivities = [...allActivities].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    console.log("Sorted activities:", sortedActivities);
    setActivities(sortedActivities);
    
    if (sortedActivities.length > 0) {
      // Initially set to first activity instead of last activity
      // This way we start from the beginning rather than showing the final state
      setCurrentTimeIndex(0);
    }
  }, [treeLogData]);
  
  // Auto-start slideshow from the beginning when component mounts
  const autoStartRef = useRef(false);
  useEffect(() => {
    // Only auto-start once when activities are first loaded
    if (activities.length > 0 && !autoStartRef.current) {
      autoStartRef.current = true;
      
      // Start the animation immediately when the page loads
      setCurrentTimeIndex(0); // Ensure we start from the first step
      setIsPlaying(true);     // Begin auto-playing immediately
      
      // Do not automatically show statistics window
      // Keep it disabled by default as requested
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
    
    // Collect all answer contents to detect duplicates
    // This set will store the content of all answer nodes
    const answerContents = new Set();
    
    // Find all question nodes and collect their answer contents
    visibleActivities.forEach((activity) => {
      if (!activity.node || activity.node.hidden) return;
      
      // If this is a question node with children (answers)
      if (activity.node.type === 'QUESTION' && activity.node.children && activity.node.children.length > 0) {
        // Store the content of each answer
        activity.node.children.forEach(answer => {
          const answerContent = answer.summary || answer.content;
          if (answerContent) {
            answerContents.add(answerContent);
          }
        });
      }
    });
    
    console.log('Collected answer contents:', Array.from(answerContents));
    
    // Second pass: create renderable nodes with proper connections, filtering out duplicates
    visibleActivities.forEach((activity, index) => {
      if (!activity.node || activity.node.hidden) return;
      
      // Skip any node that has the same content as an answer node
      // This prevents duplicates where an answer appears both under a question and as a separate node
      const nodeContent = activity.node.summary || activity.node.content;
      if (answerContents.has(nodeContent) && activity.node.type !== 'QUESTION') {
        console.log('Skipping duplicate node with content matching an answer:', nodeContent);
        return;
      }
      
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
                activity.node.type === 'COUNTER' ? 'counterargument' : 
                activity.node.type === 'QUESTION' ? 'question' : 
                activity.node.type === 'SUBJECT' ? 'subject' : 'argument',
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
        
        // Store the evidence index for proper connection positioning
        const evidenceIndex = parentArgNode.node.evidences.findIndex(e => e.id === node.triggeredByEvidenceId);
        if (evidenceIndex !== -1) {
          node.parentEvidenceIndex = evidenceIndex;
          node.parentNodeId = parentArgNode.id;
        }
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
  const rowGap = 14; // Increased row gap for better spacing
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
  
  // Special handling for second level nodes - ensure they're positioned to the right
  if (nodesByDepth.has(2)) {
    // Ensure second level nodes are positioned with enough space between them
    nodesByDepth.get(2).forEach((node, idx) => {
      // For counter nodes responding to evidence, position them aligned with their source
      if (node.node.type === 'counterargument' && node.triggeredByEvidenceId) {
        // Special positioning handled in the main loop
      }
    });
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
  
  // All connections are handled directly within the node components
  // No separate connections calculation needed
  
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

    let actionByText;
    switch (activity.actionBy) {
      case CREATOR_TYPES.STUDENT:
        actionByText = '학생';
        break;
      case CREATOR_TYPES.AI:
        actionByText = 'AI';
        break;
      case CREATOR_TYPES.TEACHER:
        actionByText = '선생님';
        break;
      default:
        actionByText = '사용자';
    }
    
    const nodeTypeText = getNodeTypeName(activity.node.type);
    
    return `${actionByText}이(가) ${nodeTypeText}를 추가했습니다`;
  };

  // Determine the actual tree data structure based on API response format
  const treeData = treeLogData && treeLogData.data ? treeLogData : { data: treeLogData };
  
  if (!treeData || !activities || activities.length === 0) {
    console.log("No tree data available:", treeData);
    return <EmptyMessage>트리 데이터가 없습니다.</EmptyMessage>;
  }

  const currentActivity = activities[currentTimeIndex];
  const assignment = treeData.data?.assignment;
  const student = treeData.data?.student;
  const statistics = treeData.data?.statistics;
  
  return (
    <TreeContainer fullPage={fullPage} className={fullPage ? 'full-page' : ''}>
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {assignment && student && (
          <TreeHeader>
            <AssignmentTitle>
              {assignment.subject}: {assignment.chapter}
            </AssignmentTitle>
            <StudentInfo>
              학생: {student.name} ({student.number})
            </StudentInfo>
          </TreeHeader>
        )}
    
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
            <StatsToggleButton 
              onClick={() => toggleStatistics()} 
              active={effectiveShowStatistics}
            >
              {effectiveShowStatistics ? '통계 숨기기' : '통계 보기'}
            </StatsToggleButton>
          </SlideshowControls>
          
          <Timeline>
            <TimelineLine />
            {activities.map((activity, index) => (
              <TimelinePoint 
                key={index}
                isCurrent={index === currentTimeIndex}
                isStudent={activity.actionBy === CREATOR_TYPES.STUDENT}
                onClick={() => handleTimelineChange(index)}
              >
                <TimelineTooltip>
                  {formatDate(activity.timestamp)}<br/>
                  {activity.actionBy === CREATOR_TYPES.STUDENT ? '학생' : 
                   activity.actionBy === CREATOR_TYPES.AI ? 'AI' : '선생님'} 활동
                </TimelineTooltip>
              </TimelinePoint>
            ))}
          </Timeline>
        </TimelineContainer>
        
        <TreeContent fullPage={fullPage}>
        <div className="tree">
          {/* Subject Node - Always visible */}
          {treeData.data && treeData.data.treeStructure && (
            <SubjectNode 
              content={treeData.data.treeStructure.content || 
                      (assignment ? (assignment.title || assignment.chapter) : "주제")} 
            />
          )}
          
          {/* First render all nodes so they're positioned correctly */}
          {renderableNodes.map((nodeData) => {
            const position = nodePositions.get(nodeData.id) || { 
              x: positionorigin.x + (colWidth * nodeData.depth), 
              y: positionorigin.y + (nodeData.depth * 200) 
            };
            
            // Determine parent evidence position if parent exists
            let parentEvidencePosition = undefined;
            
            // Set parentEvidencePosition for all nodes including counterarguments with parent evidence
            if (nodeData.parentNodeId && nodeData.parentNodeId !== 'subject') {
              const parentNode = renderableNodes.find(n => n.id === nodeData.parentNodeId);
              if (parentNode) {
                const parentRef = getNodeRef(parentNode.id);
                
                // If this node has a triggeredByEvidenceId, find the evidence in the parent node
                if (nodeData.triggeredByEvidenceId) {
                  // Find the index of the evidence in the parent's evidences array
                  const evidenceIndex = parentNode.node.evidences?.findIndex(e => e.id === nodeData.triggeredByEvidenceId);
                  if (evidenceIndex !== undefined && evidenceIndex >= 0) {
                    parentEvidencePosition = parentRef.current?.getEvidencePosition(evidenceIndex) || undefined;
                  }
                } 
                // Otherwise, if we have a parentEvidenceIndex, use that
                else if (nodeData.parentEvidenceIndex !== undefined) {
                  parentEvidencePosition = parentRef.current?.getEvidencePosition(nodeData.parentEvidenceIndex) || undefined;
                }
              }
            }
            
            if (nodeData.node.type === 'question') {
              return (
                <QuestionNode
                  key={`node-${nodeData.id}`}
                  ref={getNodeRef(nodeData.id)}
                  qNode={nodeData.node}
                  position={position}
                  parentposition={parentEvidencePosition}
                  nodeData={nodeData}
                  onNodeClick={handleNodeClick}
                />
              );
            } else {
              return (
                <ArgumentNode
                  key={`node-${nodeData.id}`}
                  ref={getNodeRef(nodeData.id)}
                  argNode={nodeData.node}
                  position={position}
                  parentposition={parentEvidencePosition}
                  childNodes={nodeData.children}
                  nodeData={nodeData}
                  onNodeClick={handleNodeClick}
                />
              );
            }
          })}
          
          {/* We're not using separate connection lines to match learnflow-web implementation */}
        </div>
        </TreeContent>
      </div>
      
      {/* Statistics Popup */}
      {effectiveShowStatistics && (
        <>
          <Overlay isOpen={effectiveShowStatistics} onClick={closeStatistics} />
          <StatisticsPopup isOpen={effectiveShowStatistics}>
            <StatisticsHeader>
              <StatisticsTitle>통계</StatisticsTitle>
              <CloseButton onClick={closeStatistics}>×</CloseButton>
            </StatisticsHeader>
            <Statistics>
              {statistics && (
            <StatCategories>
              {/* Node statistics section */}
              <StatCategory>
                <StatCategoryTitle>노드 통계</StatCategoryTitle>
                <StatGrid>
                  <StatItem color="#3E935C">
                    <StatLabel>총 노드 수</StatLabel>
                    <StatValue>{statistics.totalNodes}</StatValue>
                  </StatItem>
                  <StatItem color="#6c757d">
                    <StatLabel>학생 노드</StatLabel>
                    <StatValue>{statistics.studentNodes}</StatValue>
                  </StatItem>
                  <StatItem color="#20c997">
                    <StatLabel>AI 노드</StatLabel>
                    <StatValue>{statistics.aiNodes}</StatValue>
                  </StatItem>
                </StatGrid>
                
                {/* Node contribution visualization */}
                {statistics.totalNodes > 0 && (
                  <>
                    <ContributionBar>
                      <StudentContribution 
                        percentage={(statistics.studentNodes / statistics.totalNodes) * 100} 
                      />
                      <AIContribution 
                        studentPercentage={(statistics.studentNodes / statistics.totalNodes) * 100}
                        percentage={(statistics.aiNodes / statistics.totalNodes) * 100} 
                      />
                    </ContributionBar>
                    <ContributionLegend>
                      <LegendItem>
                        <LegendColor color="#6c757d" />
                        학생 {Math.round((statistics.studentNodes / statistics.totalNodes) * 100)}%
                      </LegendItem>
                      <LegendItem>
                        <LegendColor color="#20c997" />
                        AI {Math.round((statistics.aiNodes / statistics.totalNodes) * 100)}%
                      </LegendItem>
                    </ContributionLegend>
                  </>
                )}
              </StatCategory>
              
              {/* Evidence statistics section */}
              <StatCategory>
                <StatCategoryTitle>근거 통계</StatCategoryTitle>
                <StatGrid>
                  <StatItem color="#385FA2">
                    <StatLabel>총 근거 수</StatLabel>
                    <StatValue>{statistics.totalEvidences}</StatValue>
                  </StatItem>
                  <StatItem color="#6c757d">
                    <StatLabel>학생 근거</StatLabel>
                    <StatValue>{statistics.studentEvidences}</StatValue>
                  </StatItem>
                  <StatItem color="#20c997">
                    <StatLabel>AI 근거</StatLabel>
                    <StatValue>{statistics.aiEvidences}</StatValue>
                  </StatItem>
                </StatGrid>
                
                {/* Evidence contribution visualization */}
                {statistics.totalEvidences > 0 && (
                  <>
                    <ContributionBar>
                      <StudentContribution 
                        percentage={(statistics.studentEvidences / statistics.totalEvidences) * 100} 
                      />
                      <AIContribution 
                        studentPercentage={(statistics.studentEvidences / statistics.totalEvidences) * 100}
                        percentage={(statistics.aiEvidences / statistics.totalEvidences) * 100} 
                      />
                    </ContributionBar>
                    <ContributionLegend>
                      <LegendItem>
                        <LegendColor color="#6c757d" />
                        학생 {Math.round((statistics.studentEvidences / statistics.totalEvidences) * 100)}%
                      </LegendItem>
                      <LegendItem>
                        <LegendColor color="#20c997" />
                        AI {Math.round((statistics.aiEvidences / statistics.totalEvidences) * 100)}%
                      </LegendItem>
                    </ContributionLegend>
                  </>
                )}
              </StatCategory>
              
              {/* Activity statistics section */}
              <StatCategory>
                <StatCategoryTitle>활동 통계</StatCategoryTitle>
                <StatGrid>
                  <StatItem color="#CC2A53">
                    <StatLabel>AI 상호작용</StatLabel>
                    <StatValue>{statistics.aiInteractions}</StatValue>
                  </StatItem>
                  <StatItem color="#212529">
                    <StatLabel>총 활동 기간</StatLabel>
                    <StatValue>{statistics.totalDuration}</StatValue>
                  </StatItem>
                </StatGrid>
              </StatCategory>
              
              {/* Summary section - conditionally rendered based on hideNodeTypesSection prop */}
              {!hideNodeTypesSection && (
                <StatSummary>
                  <SummaryItem>
                    <SummaryLabel>노드 유형</SummaryLabel>
                    <SummaryValue color="#3E935C">주장 {statistics.argumentNodes || '-'}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>예상 반론</SummaryLabel>
                    <SummaryValue color="#CC2A53">{statistics.counterargumentNodes || '-'}</SummaryValue>
                  </SummaryItem>
                  <SummaryItem>
                    <SummaryLabel>예상 질문</SummaryLabel>
                    <SummaryValue color="#385FA2">{statistics.questionNodes || '-'}</SummaryValue>
                  </SummaryItem>
                </StatSummary>
              )}
            </StatCategories>
              )}
            </Statistics>
          </StatisticsPopup>
        </>
      )}
      
      {/* Handle closing the node detail panel */}
      <NodeDetailPanelComponent
        isOpen={isDetailPanelOpen}
        onClose={() => setIsDetailPanelOpen(false)}
        selectedNode={selectedNode}
        assignment={treeData.data?.assignment}
        student={treeData.data?.student}
        chatMessages={chatMessages}
        loading={loadingMessages}
      />
    </TreeContainer>
  );
};

export default StudentTreeProgress;