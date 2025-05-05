import React from 'react';
import styled from 'styled-components';

const MultiSelect = ({ 
  label, 
  options, 
  selectedValues, 
  onChange, 
  error, 
  required, 
  disabled,
  ...props 
}) => {
  
  const handleChange = (id) => {
    if (selectedValues.includes(id)) {
      onChange(selectedValues.filter(item => item !== id));
    } else {
      onChange([...selectedValues, id]);
    }
  };

  return (
    <MultiSelectWrapper {...props}>
      {label && (
        <Label>
          {label}{required && <Required>*</Required>}
        </Label>
      )}
      
      <OptionsContainer>
        {options.map(option => (
          <OptionItem key={option.id}>
            <Checkbox
              type="checkbox"
              id={`option-${option.id}`}
              checked={selectedValues.includes(option.id)}
              onChange={() => handleChange(option.id)}
              disabled={disabled}
            />
            <CheckboxLabel htmlFor={`option-${option.id}`}>
              {option.name}
            </CheckboxLabel>
          </OptionItem>
        ))}
      </OptionsContainer>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <SelectedCount>
        {selectedValues.length}명 선택됨
      </SelectedCount>
    </MultiSelectWrapper>
  );
};

const MultiSelectWrapper = styled.div`
  margin-bottom: 1.5rem;
  width: 100%;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #495057;
  display: block;
`;

const Required = styled.span`
  color: #e63946;
  margin-left: 4px;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background-color: #fff;
`;

const OptionItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background-color: #f8f9fa;
  margin-right: 0.5rem;
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  cursor: pointer;
  font-size: 0.875rem;
`;

const ErrorMessage = styled.p`
  color: #e63946;
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const SelectedCount = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
  text-align: right;
  margin-top: 0.25rem;
`;

export default MultiSelect;