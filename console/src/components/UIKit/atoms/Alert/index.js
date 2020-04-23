import React from 'react';

import { theme } from '../../theme';
import { Icon } from '../Icon';
import { StyledAlert } from './Alert';
import { Text } from '../Typography';

const alertWidth = 866;

export const Alert = props => {
  const { children, type } = props;

  const backgroundColorValue = theme.alert[type]
    ? theme.alert[type].backgroundColor
    : theme.alert.default.backgroundColor;

  const borderColorValue = theme.alert[type]
    ? theme.alert[type].borderColor
    : theme.alert.default.borderColor;

  let alertMessage;

  if (children) {
    alertMessage = children;
  } else {
    alertMessage = theme.alert[type]
      ? theme.alert[type].message
      : theme.alert.default.message;
  }

  return (
    <StyledAlert
      width={alertWidth}
      bg={backgroundColorValue}
      borderRadius="xs"
      fontSize="p"
      borderLeft={4}
      borderColor={borderColorValue}
      boxShadow={2}
      height="lg"
      pl="md"
      display="flex"
      alignItems="center"
      color="black.text"
      {...props}
    >
      <Icon type={type} color={borderColorValue} />
      {type && (
        <Text as="span" pl="md" fontWeight="medium">
          {type}
        </Text>
      )}
      <Text pl="md">{alertMessage}</Text>
    </StyledAlert>
  );
};
