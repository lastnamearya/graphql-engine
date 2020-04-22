import styled from 'styled-components';
import {
  flexbox,
  color,
  border,
  typography,
  layout,
  space,
  shadow,
} from 'styled-system';

export const StyledAlert = styled.div`
  ${flexbox};
  ${color}
  ${border}
  ${typography}
  ${layout}
  ${space}
  ${shadow}

  /* Alert type text */
  span {
    text-transform: capitalize;
  }
`;
