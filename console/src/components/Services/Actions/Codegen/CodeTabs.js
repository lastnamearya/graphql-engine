import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';

import JSEditor from '../../../Common/AceEditor/JavaScriptEditor';
import TSEditor from '../../../Common/AceEditor/TypescriptEditor';
import { getFrameworkCodegen } from './utils';
import { getFileExtensionFromFilename } from '../../../Common/utils/jsUtils';
import { Spinner, Link } from '../../../UIKit/atoms';

const CodeTabs = ({
  framework,
  actionsSdl,
  currentAction,
  parentMutation,
  shouldDerive,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [codegenFiles, setCodegenFiles] = React.useState([]);

  const init = () => {
    setLoading(true);
    setError(null);
    getFrameworkCodegen(
      framework,
      currentAction.action_name,
      actionsSdl,
      shouldDerive ? parentMutation : null
    )
      .then(codeFiles => {
        setCodegenFiles(codeFiles);
        setLoading(false);
      })
      .catch(e => {
        setError(e);
        setLoading(false);
      });
  };

  React.useEffect(init, [framework, parentMutation, shouldDerive]);

  if (loading) {
    return <Spinner size="xl" my="100px" mx="auto" />;
  }

  if (error) {
    return (
      <div>
        Error generating code.&nbsp;
        <Link onClick={init} hover="underline">
          Try again
        </Link>
      </div>
    );
  }

  const files = codegenFiles.map(({ name, content }, i) => {
    const getFileTab = (component, filename) => {
      return (
        <Tab eventKey={filename} title={filename} key={i}>
          {component}
        </Tab>
      );
    };

    const editorProps = {
      width: '600px',
      value: content.trim(),
      readOnly: true,
    };

    switch (getFileExtensionFromFilename(name)) {
      case 'ts':
        return getFileTab(<TSEditor {...editorProps} />, name);
      default:
        return getFileTab(<JSEditor {...editorProps} />, name);
    }
  });

  return <Tabs id="codegen-files-tabs">{files} </Tabs>;
};

export default CodeTabs;
