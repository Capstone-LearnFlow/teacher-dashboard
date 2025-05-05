import React from 'react';
import styled, { css } from 'styled-components';

const Button = ({ 
  children, 
  primary, 
  secondary, 
  outlined, 
  small, 
  fullWidth, 
  onClick, 
  type = 'button',
  disabled,
  ...props 
}) => {
  return (
    <StyledButton 
      onClick={onClick} 
      type={type}
      primary={primary}
      secondary={secondary}
      outlined={outlined}
      small={small}
      fullWidth={fullWidth}
      disabled={disabled}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.small ? '0.5rem 1rem' : '0.75rem 1.5rem'};
  font-size: ${props => props.small ? '0.875rem' : '1rem'};
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.2s ease-in-out;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.7 : 1};
  
  ${props => props.primary && css`
    background-color: #4361EE;
    color: white;
    border: 1px solid #4361EE;
    
    &:hover {
      background-color: #3A56D4;
      border-color: #3A56D4;
    }
  `}
  
  ${props => props.secondary && css`
    background-color: #6C757D;
    color: white;
    border: 1px solid #6C757D;
    
    &:hover {
      background-color: #5A6268;
      border-color: #5A6268;
    }
  `}
  
  ${props => props.outlined && css`
    background-color: transparent;
    color: ${props.primary ? '#4361EE' : props.secondary ? '#6C757D' : '#4361EE'};
    border: 1px solid ${props.primary ? '#4361EE' : props.secondary ? '#6C757D' : '#4361EE'};
    
    &:hover {
      background-color: ${props.primary ? 'rgba(67, 97, 238, 0.05)' : 
        props.secondary ? 'rgba(108, 117, 125, 0.05)' : 'rgba(67, 97, 238, 0.05)'};
    }
  `}
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 0.2rem rgba(67, 97, 238, 0.25);
  }

  &:disabled {
    background-color: ${props => props.outlined ? 'transparent' : '#E9ECEF'};
    color: ${props => props.outlined ? '#ADB5BD' : '#6C757D'};
    border-color: ${props => props.outlined ? '#ADB5BD' : '#E9ECEF'};
    cursor: not-allowed;
    
    &:hover {
      background-color: ${props => props.outlined ? 'transparent' : '#E9ECEF'};
      border-color: ${props => props.outlined ? '#ADB5BD' : '#E9ECEF'};
    }
  }
`;

export default Button;