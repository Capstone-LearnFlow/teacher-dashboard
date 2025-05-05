import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../App';
import Button from './Button';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <HeaderContainer>
      <div className="container">
        <HeaderContent>
          <LogoSection>
            <AppTitle to="/dashboard">교사용 과제 관리 시스템</AppTitle>
          </LogoSection>

          <NavLinks>
            <NavLink to="/dashboard">과제 목록</NavLink>
            <NavLink to="/create-assignment">과제 생성</NavLink>
          </NavLinks>

          <UserSection>
            {user && (
              <>
                <UserName>{user.name} 선생님</UserName>
                <Button secondary small onClick={handleLogout}>
                  로그아웃
                </Button>
              </>
            )}
          </UserSection>
        </HeaderContent>
      </div>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
`;

const AppTitle = styled(Link)`
  font-size: 1.5rem;
  font-weight: 700;
  color: #4361EE;
  text-decoration: none;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const NavLinks = styled.nav`
  display: flex;
  gap: 2rem;
  
  @media (max-width: 768px) {
    gap: 1rem;
    margin: 0.5rem 0;
  }
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: #495057;
  font-weight: 500;
  padding: 0.5rem 0;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #4361EE;
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }
  
  &:hover, &.active {
    color: #4361EE;
    
    &:after {
      transform: scaleX(1);
    }
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserName = styled.span`
  font-weight: 500;
  color: #495057;
`;

export default Header;