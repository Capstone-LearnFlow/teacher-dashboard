import React from 'react';
import styled from 'styled-components';
import StudentTreeProgress from './StudentTreeProgress';
import mockTreeData from '../mock/treeDataTest';
import '../styles/TreeStyles.css';

/**
 * Test component for visualizing the tree structure
 * This component uses mock data to simulate the tree visualization
 * without needing to make actual API calls
 */
const TreeVisualizationTest = () => {
  return (
    <TestContainer>
      <TestHeader>
        <h1>Tree Visualization Test</h1>
        <p>This is a test component for visualizing the tree structure using mock data.</p>
        <p>Assignment: {mockTreeData.data.assignment.subject} - {mockTreeData.data.assignment.chapter}</p>
        <p>Student: {mockTreeData.data.student.name} ({mockTreeData.data.student.number})</p>
      </TestHeader>
      
      <TreeContainer>
        <StudentTreeProgress treeLogData={mockTreeData} fullPage={true} />
      </TreeContainer>
      
      <TestFooter>
        <p>Tree statistics:</p>
        <ul>
          <li>Total nodes: {mockTreeData.data.statistics.totalNodes}</li>
          <li>Student nodes: {mockTreeData.data.statistics.studentNodes}</li>
          <li>AI nodes: {mockTreeData.data.statistics.aiNodes}</li>
        </ul>
      </TestFooter>
    </TestContainer>
  );
};

const TestContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const TestHeader = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
  
  h1 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
  
  p {
    margin-bottom: 0.5rem;
    color: #495057;
  }
`;

const TreeContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  min-height: 600px;
`;

const TestFooter = styled.div`
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
  
  p {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  ul {
    list-style-type: none;
    padding-left: 1rem;
    
    li {
      margin-bottom: 0.25rem;
      color: #495057;
    }
  }
`;

export default TreeVisualizationTest;