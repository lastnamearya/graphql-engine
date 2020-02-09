import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { Buttons } from './demo/Button';
import { ColorScheme, Shades } from './demo/Colors';
import { TextLinks, Typography } from './demo/Typography';
import { Alerts } from './demo/Alerts';
import { BoxShadows } from './demo/Shadows';

import Button from './atoms/Button';
import AlertBox from './atoms/AlertBox';
import ToolTip from './atoms/Tooltip';

import { Flex, UIKitWrapperDiv, Heading } from './demo/styles';

// UIKit(Parent) Demo component ************* //

const UIKit = () => (
  <UIKitWrapperDiv
    fontFamily="roboto" // ~ theme.fonts.roboto
    p="lg" // ~ padding: theme.space.lg
    mb="xl" // ~ margin-bottom: theme.space.xl
    bg="white" // ~ theme.colors.white
  >
    {/* UI Components ***************************/}
    {/* Buttons ~ large size */}
    <Flex mb="lg">
      <Button type="primary" size="large" mr="lg">
        Primary Button
      </Button>
      <Button type="secondary" size="large" mr="lg">
        Secondary Button
      </Button>
      <Button type="success" size="large" mr="lg">
        Success Button
      </Button>
      <Button type="danger" size="large" mr="lg">
        Danger Button
      </Button>
      <Button type="warning" size="large" mr="lg">
        Warning Button
      </Button>
      <Button type="info" size="large" mr="lg">
        Info Button
      </Button>
    </Flex>
    {/* Buttons ~ small size */}
    <Flex mb="lg">
      <Button type="primary" mr="lg">
        Primary Button
      </Button>
      <Button type="outOfRange" mr="lg">
        Default Type
      </Button>
    </Flex>
    {/* Disabled State */}
    <Flex mb="lg">
      <Button type="primary" mr="lg" disabled>
        Primary Button
      </Button>
      <Button type="secondary" mr="lg" disabled>
        Secondary Button
      </Button>
      <Button type="success" mr="lg" disabled>
        Success Button
      </Button>
      <Button type="danger" mr="lg" disabled>
        Danger Button
      </Button>
      <Button type="warning" mr="lg" disabled>
        Warning Button
      </Button>
      <Button type="info" mr="lg" disabled>
        Info Button
      </Button>
    </Flex>
    {/* AlertBox  *******************************/}
    <AlertBox type="success" my="lg">
      Hello Testing!
    </AlertBox>
    <AlertBox type="info" my="lg" />
    <AlertBox type="warning" my="lg" />
    <AlertBox type="error" my="lg" />
    <AlertBox type="default" my="lg">
      dummy alert!
    </AlertBox>
    {/* ToolTip */}
    <Flex mb="lg">
      <ToolTip message="Dummy Text" placement="top" mr="md">
        Hover me!!
      </ToolTip>
      <ToolTip message="Primary Button" mr="md">
        <Button type="primary" size="small">
          Hover me!
        </Button>
      </ToolTip>
      <ToolTip message="Dummy Text" placement="bottom" mr="md">
        Bottom
      </ToolTip>
      <ToolTip message="Dummy Text" placement="left">
        Left
      </ToolTip>
    </Flex>
    {/* **************************************** */}
    {/* UI Elements *****************************/}
    <Heading color="black.text">UI Elements</Heading>
    <Heading as="h3" color="black.text" my="lg">
      Colors
    </Heading>
    <ColorScheme />
    <Shades />
    <Heading as="h3" color="black.text" my="lg">
      Buttons
    </Heading>
    <Buttons />
    <Heading as="h3" color="black.text" my="lg">
      Shadows
    </Heading>
    <BoxShadows />
    <Heading as="h3" color="black.text" my="lg">
      Alerts
    </Heading>
    <Alerts />
    <Heading as="h3" color="black.text" my="lg">
      Text Links
    </Heading>
    <TextLinks />
    <Heading as="h3" color="black.text" my="lg">
      Typography
    </Heading>
    <Typography />
  </UIKitWrapperDiv>
);

// ************************************ //

UIKit.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

// ************************************ //

export default connect()(UIKit);
