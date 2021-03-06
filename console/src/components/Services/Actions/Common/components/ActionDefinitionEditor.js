import React from 'react';
import { parse as sdlParse } from 'graphql/language/parser';

import SDLEditor from '../../../../Common/AceEditor/SDLEditor';
import {
  Icon,
  ToolTip,
  Heading,
  Text,
  Flex,
  Box,
} from '../../../../UIKit/atoms';
import styles from './Styles.scss';

const editorLabel = 'Action definition';
const editorTooltip =
  'Define the action as a query or a mutation using GraphQL SDL. You can use the custom types already defined by you or define new types in the new types definition editor below.';

const ActionDefinitionEditor = ({
  value,
  onChange,
  className,
  placeholder,
  error,
  timer,
}) => {
  const onChangeWithError = v => {
    if (timer) {
      clearTimeout(timer);
    }

    const parseDebounceTimer = setTimeout(() => {
      let _e = null;
      let ast = null;
      try {
        ast = sdlParse(v);
      } catch (e) {
        _e = e;
      }
      onChange(null, _e, null, ast);
    }, 1000);

    onChange(v, null, parseDebounceTimer, null);
  };

  const errorMessage =
    error && (error.message || 'This is not valid GraphQL SDL');

  let markers = [];
  if (error && error.locations) {
    markers = error.locations.map(l => ({
      row: l.line,
      column: l.column,
      type: 'error',
      message: errorMessage,
      className: styles.errorMarker,
    }));
  }

  return (
    <div className={`${className || ''}`}>
      <Heading type="subHeading" mb="xs">
        {editorLabel}
        <ToolTip message={editorTooltip} ml="sm" />
      </Heading>
      <Box>
        <Flex mb="5px">
          {error && (
            <Flex>
              <Icon type="close" color="red.primary" mr="xs" />
              <Text color="red.primary">{errorMessage}</Text>
            </Flex>
          )}
        </Flex>
        <SDLEditor
          name="sdl-editor"
          value={value}
          onChange={onChangeWithError}
          placeholder={placeholder}
          markers={markers}
          height="200px"
          width="600px"
        />
      </Box>
    </div>
  );
};

export default ActionDefinitionEditor;
