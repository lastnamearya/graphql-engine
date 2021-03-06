import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import AceEditor from 'react-ace';
import 'brace/mode/sql';
import Modal from '../../../Common/Modal/Modal';
import Button from '../../../Common/Button/Button';
import { parseCreateSQL } from './utils';
import { checkSchemaModification } from '../../../Common/utils/sqlUtils';

import {
  executeSQL,
  SET_SQL,
  SET_CASCADE_CHECKED,
  SET_MIGRATION_CHECKED,
  SET_TRACK_TABLE_CHECKED,
} from './Actions';
import { modalOpen, modalClose } from './Actions';
import globals from '../../../../Globals';
import './AceEditorFix.css';
import {
  ACE_EDITOR_THEME,
  ACE_EDITOR_FONT_SIZE,
} from '../../../Common/AceEditor/utils';
import { CLI_CONSOLE_MODE } from '../../../../constants';
import { Icon, ToolTip, Heading, Box, Text } from '../../../UIKit/atoms';
import styles from '../../../Common/TableCommon/Table.scss';

const RawSQL = ({
  sql,
  resultType,
  result,
  resultHeaders,
  dispatch,
  ongoingRequest,
  lastError,
  lastSuccess,
  isModalOpen,
  isCascadeChecked,
  isMigrationChecked,
  isTableTrackChecked,
  migrationMode,
  allSchemas,
}) => {
  // local storage key for SQL
  const LS_RAW_SQL_SQL = 'rawSql:sql';

  /* hooks */

  // set up sqlRef to use in unmount
  const sqlRef = useRef(sql);

  // set SQL from localStorage on mount and write back to localStorage on unmount
  useEffect(() => {
    if (!sql) {
      const sqlFromLocalStorage = localStorage.getItem(LS_RAW_SQL_SQL);
      if (sqlFromLocalStorage) {
        dispatch({ type: SET_SQL, data: sqlFromLocalStorage });
      }
    }

    return () => {
      localStorage.setItem(LS_RAW_SQL_SQL, sqlRef.current);
    };
  }, []);

  // set SQL to sqlRef
  useEffect(() => {
    sqlRef.current = sql;
  }, [sql]);

  /* hooks - end */

  const cascadeTip =
    'Cascade actions on all dependent metadata references, like relationships and permissions';

  const migrationTip = 'Create a migration file with the SQL statement';

  const migrationNameTip =
    "Name of the generated migration file. Default: 'run_sql_migration";

  const trackTableTip =
    'If you are creating a table/view/function, checking this will also expose them over the GraphQL API';

  const submitSQL = () => {
    // set SQL to LS
    localStorage.setItem(LS_RAW_SQL_SQL, sql);

    // check migration mode global
    if (migrationMode) {
      const checkboxElem = document.getElementById('migration-checkbox');
      const isMigration = checkboxElem ? checkboxElem.checked : false;
      const textboxElem = document.getElementById('migration-name');
      let migrationName = textboxElem ? textboxElem.value : '';
      if (isMigration && migrationName.length === 0) {
        migrationName = 'run_sql_migration';
      }
      if (!isMigration && globals.consoleMode === CLI_CONSOLE_MODE) {
        // if migration is not checked, check if is schema modification
        if (checkSchemaModification(sql)) {
          dispatch(modalOpen());
          const confirmation = false;
          if (confirmation) {
            dispatch(executeSQL(isMigration, migrationName));
          }
        } else {
          dispatch(executeSQL(isMigration, migrationName));
        }
      } else {
        dispatch(executeSQL(isMigration, migrationName));
      }
    } else {
      dispatch(executeSQL(false, ''));
    }
  };

  let alert = null;

  if (ongoingRequest) {
    alert = (
      <div className={`${styles.padd_left_remove} col-xs-12`}>
        <div className="hidden alert alert-warning" role="alert">
          Running...
        </div>
      </div>
    );
  } else if (lastError) {
    alert = (
      <div className={`${styles.padd_left_remove} col-xs-12`}>
        <div className="hidden alert alert-danger" role="alert">
          Error: {JSON.stringify(lastError)}
        </div>
      </div>
    );
  } else if (lastSuccess) {
    alert = (
      <div className={`${styles.padd_left_remove} col-xs-12`}>
        <div className="hidden alert alert-success" role="alert">
          Executed Query
        </div>
      </div>
    );
  }

  const getMigrationWarningModal = () => {
    const onModalClose = () => {
      dispatch(modalClose());
    };

    const onConfirmNoMigration = () => {
      const isMigration = document.getElementById('migration-checkbox').checked;
      dispatch(modalClose());
      dispatch(executeSQL(isMigration));
    };

    return (
      <Modal
        show={isModalOpen}
        title={'Run SQL'}
        onClose={onModalClose}
        onSubmit={onConfirmNoMigration}
        submitText={'Yes, I confirm'}
        submitTestId={'not-migration-confirm'}
      >
        <div className="content-fluid">
          <div className="row">
            <div className="col-xs-12">
              Your SQL statement is most likely modifying the database schema.
              Are you sure it is not a migration?
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  const getSQLSection = () => {
    const handleSQLChange = val => {
      dispatch({ type: SET_SQL, data: val });

      // set migration checkbox true
      if (checkSchemaModification(val)) {
        dispatch({ type: SET_MIGRATION_CHECKED, data: true });
      } else {
        dispatch({ type: SET_MIGRATION_CHECKED, data: false });
      }

      // set track this checkbox true
      const objects = parseCreateSQL(val);
      if (objects.length) {
        let allObjectsTrackable = true;

        const trackedObjectNames = allSchemas.map(schema => {
          return [schema.table_schema, schema.table_name].join('.');
        });

        for (let i = 0; i < objects.length; i++) {
          const object = objects[i];

          if (object.type === 'function') {
            allObjectsTrackable = false;
            break;
          } else {
            const objectName = [object.schema, object.name].join('.');

            if (trackedObjectNames.includes(objectName)) {
              allObjectsTrackable = false;
              break;
            }
          }
        }

        if (allObjectsTrackable) {
          dispatch({ type: SET_TRACK_TABLE_CHECKED, data: true });
        } else {
          dispatch({ type: SET_TRACK_TABLE_CHECKED, data: false });
        }
      } else {
        dispatch({ type: SET_TRACK_TABLE_CHECKED, data: false });
      }
    };

    return (
      <Box mt="20px">
        <AceEditor
          data-test="sql-test-editor"
          mode="sql"
          theme={ACE_EDITOR_THEME}
          fontSize={ACE_EDITOR_FONT_SIZE}
          name="raw_sql"
          value={sql}
          minLines={15}
          maxLines={100}
          width="100%"
          showPrintMargin={false}
          commands={[
            {
              name: 'submit',
              bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
              exec: () => {
                submitSQL();
              },
            },
          ]}
          onChange={handleSQLChange}
        />
      </Box>
    );
  };

  const getResultTable = () => {
    let resultTable = null;

    if (resultType && resultType !== 'command') {
      const getTableHeadings = () => {
        return resultHeaders.map((columnName, i) => (
          <th key={i}>{columnName}</th>
        ));
      };

      const getRows = () => {
        return result.map((row, i) => (
          <tr key={i}>
            {row.map((columnValue, j) => (
              <td key={j}>{columnValue}</td>
            ))}
          </tr>
        ));
      };

      resultTable = (
        <div
          className={`${styles.addCol} col-xs-12 ${styles.padd_left_remove}`}
        >
          <Heading type="subHeading">SQL Result:</Heading>
          <div className={styles.tableContainer}>
            <table
              className={`table table-bordered table-striped table-hover ${styles.table} `}
            >
              <thead>
                <tr>{getTableHeadings()}</tr>
              </thead>
              <tbody>{getRows()}</tbody>
            </table>
          </div>
          <br />
          <br />
        </div>
      );
    }

    return resultTable;
  };

  const getNotesSection = () => {
    return (
      <ul>
        <li>
          You can create views, alter tables or just about run any SQL
          statements directly on the database.
        </li>
        <li>
          Multiple SQL statements can be separated by semicolons, <code>;</code>
          , however, only the result of the last SQL statement will be returned.
        </li>
        <li>
          Multiple SQL statements will be run as a transaction. i.e. if any
          statement fails, none of the statements will be applied.
        </li>
      </ul>
    );
  };

  const getMetadataCascadeSection = () => (
    <Box mt="5px">
      <label>
        <input
          checked={isCascadeChecked}
          className={`${styles.add_mar_right_small} ${styles.cursorPointer}`}
          id="cascade-checkbox"
          type="checkbox"
          onChange={() => {
            dispatch({
              type: SET_CASCADE_CHECKED,
              data: !isCascadeChecked,
            });
          }}
        />
        Cascade metadata
      </label>
      <ToolTip message={cascadeTip}>
        <Icon type="info" ml="sm" size={12} />
      </ToolTip>
    </Box>
  );

  const getTrackThisSection = () => {
    const dispatchTrackThis = () => {
      dispatch({
        type: SET_TRACK_TABLE_CHECKED,
        data: !isTableTrackChecked,
      });
    };

    return (
      <Box mt="20px">
        <label>
          <input
            checked={isTableTrackChecked}
            className={`${styles.add_mar_right_small} ${styles.cursorPointer}`}
            id="track-checkbox"
            type="checkbox"
            onChange={dispatchTrackThis}
            data-test="raw-sql-track-check"
          />
          Track this
        </label>
        <ToolTip message={trackTableTip}>
          <Icon type="info" ml="sm" size={12} />
        </ToolTip>
      </Box>
    );
  };

  const getMigrationSection = () => {
    let migrationSection = null;

    const getIsMigrationSection = () => {
      const dispatchIsMigration = () => {
        dispatch({
          type: SET_MIGRATION_CHECKED,
          data: !isMigrationChecked,
        });
      };

      return (
        <div>
          <label>
            <input
              checked={isMigrationChecked}
              className={styles.add_mar_right_small}
              id="migration-checkbox"
              type="checkbox"
              onChange={dispatchIsMigration}
              data-test="raw-sql-migration-check"
            />
            This is a migration
          </label>
          <ToolTip message={migrationTip}>
            <Icon type="info" ml="sm" size={12} />
          </ToolTip>
        </div>
      );
    };

    const getMigrationNameSection = () => {
      let migrationNameSection = null;

      if (isMigrationChecked) {
        migrationNameSection = (
          <Box mt="5px" ml="20px">
            <div>
              <label className={styles.add_mar_right}>Migration name:</label>
              <input
                className={
                  styles.inline_block +
                  ' ' +
                  styles.tableNameInput +
                  ' ' +
                  styles.add_mar_right_small +
                  ' ' +
                  ' form-control'
                }
                placeholder={'run_sql_migration'}
                id="migration-name"
                type="text"
              />
              <ToolTip message={migrationNameTip}>
                <Icon type="info" ml="sm" size={12} />
              </ToolTip>
              <Text fontStyle="italic" color="grey.tab" mt="5px">
                Note: down migration will not be generated for statements run
                using Raw SQL.
              </Text>
            </div>
          </Box>
        );
      }

      return migrationNameSection;
    };

    if (migrationMode && globals.consoleMode === CLI_CONSOLE_MODE) {
      migrationSection = (
        <Box mt="5px">
          {getIsMigrationSection()}
          {getMigrationNameSection()}
        </Box>
      );
    }

    return migrationSection;
  };

  const getRunButton = () => {
    return (
      <Button
        type="submit"
        className={styles.add_mar_top}
        onClick={submitSQL}
        color="yellow"
        size="sm"
        data-test="run-sql"
      >
        Run!
      </Button>
    );
  };

  return (
    <div
      className={`${styles.clear_fix} ${styles.padd_left} ${styles.padd_top}`}
    >
      <Helmet title="Run SQL - Data | Hasura" />
      <div className={styles.subHeader}>
        <Heading as="h2" pb="0px" fontSize="18px">
          Raw SQL
        </Heading>
        <div className="clearfix" />
      </div>
      <Box mt="20px">
        <div>
          <div className={`${styles.padd_left_remove} col-xs-8`}>
            {getNotesSection()}
          </div>

          <div className={`${styles.padd_left_remove} col-xs-10`}>
            {getSQLSection()}
          </div>
          <Box mb="20px" pl="0px" className="col-xs-8">
            {getTrackThisSection()}
            {getMetadataCascadeSection()}
            {getMigrationSection()}

            {getRunButton()}
          </Box>
        </div>
        <div className="hidden col-xs-4">{alert}</div>
      </Box>

      {getMigrationWarningModal()}
      <Box mb="20px">{getResultTable()}</Box>
    </div>
  );
};

RawSQL.propTypes = {
  sql: PropTypes.string.isRequired,
  resultType: PropTypes.string.isRequired,
  result: PropTypes.array.isRequired,
  resultHeaders: PropTypes.array.isRequired,
  allSchemas: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired,
  ongoingRequest: PropTypes.bool.isRequired,
  lastError: PropTypes.object.isRequired,
  lastSuccess: PropTypes.bool.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
  isMigrationChecked: PropTypes.bool.isRequired,
  isTableTrackChecked: PropTypes.bool.isRequired,
  migrationMode: PropTypes.bool.isRequired,
  currentSchema: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  ...state.rawSQL,
  migrationMode: state.main.migrationMode,
  currentSchema: state.tables.currentSchema,
  allSchemas: state.tables.allSchemas,
  serverVersion: state.main.serverVersion ? state.main.serverVersion : '',
});

const rawSQLConnector = connect => connect(mapStateToProps)(RawSQL);

export default rawSQLConnector;
