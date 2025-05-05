import React from 'react';
import styled from 'styled-components';

const Input = ({ 
  label, 
  id, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  required, 
  error,
  fullWidth,
  ...props 
}) => {
  return (
    <InputWrapper fullWidth={fullWidth}>
      {label && <InputLabel htmlFor={id}>{label}{required && <Required>*</Required>}</InputLabel>}
      <StyledInput
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        error={error}
        {...props}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </InputWrapper>
  );
};

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
`;

const InputLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #495057;
  display: flex;
  align-items: center;
`;

const Required = styled.span`
  color: #e63946;
  margin-left: 4px;
`;

const StyledInput = styled.input`
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid ${props => props.error ? '#e63946' : '#ced4da'};
  border-radius: 4px;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: #4361EE;
    box-shadow: 0 0 0 0.2rem rgba(67, 97, 238, 0.25);
  }
  
  &::placeholder {
    color: #adb5bd;
  }
  
  &:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #e63946;
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

export default Input;