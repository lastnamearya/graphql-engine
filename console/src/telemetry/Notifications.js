import React from 'react';
import Notifications from 'react-notification-system-redux';

import { setTelemetryNotificationShownInDB } from './Actions';
import { TextLink, Alert } from '../components/UIKit/atoms';

const onRemove = () => {
  return dispatch => {
    dispatch(setTelemetryNotificationShownInDB());
  };
};

const showTelemetryNotification = () => {
  return dispatch => {
    dispatch(
      Notifications.show({
        position: 'tr',
        autoDismiss: 10000,
        level: 'info',
        // title: 'Telemetry',
        children: (
          <Alert type="success">
            Help us improve Hasura! The console collects anonymized usage stats
            which allows us to keep improving Hasura at warp speed.
            <TextLink
              href="https://hasura.io/docs/1.0/graphql/manual/guides/telemetry.html"
              target="_blank"
              mx="xs"
              fontSize="13px"
            >
              Click here
            </TextLink>
            to read more or to opt-out.
          </Alert>
        ),
        onRemove: () => dispatch(onRemove()),
      })
    );
  };
};

export { showTelemetryNotification };
