import React, { Component } from 'react';
import PropTypes from 'prop-types';

import jwt from 'jsonwebtoken';

import TextAreaWithCopy from '../../../Common/TextAreaWithCopy/TextAreaWithCopy';
import Modal from '../../../Common/Modal/Modal';
import { ToolTip } from '../../../UIKit/atoms';

import {
  changeRequestHeader,
  removeRequestHeader,
  focusHeaderTextbox,
  unfocusTypingHeader,
  verifyJWTToken,
  setHeadersBulk,
} from '../Actions';

import GraphiQLWrapper from '../GraphiQLWrapper/GraphiQLWrapper';

import CollapsibleToggle from '../../../Common/CollapsibleToggle/CollapsibleToggle';

import {
  getEndPointSectionIsOpen,
  setEndPointSectionIsOpen,
  getHeadersSectionIsOpen,
  setHeadersSectionIsOpen,
  persistGraphiQLHeaders,
  getPersistedGraphiQLHeaders,
  parseAuthHeader,
  getDefaultGraphiqlHeaders,
  getAdminSecret,
  getPersistedAdminSecretHeaderWasAdded,
  persistAdminSecretHeaderWasAdded,
  removePersistedAdminSecretHeaderWasAdded,
} from './utils';
import { Icon, Spinner } from '../../../UIKit/atoms';

import styles from '../ApiExplorer.scss';
import { ADMIN_SECRET_HEADER_KEY } from '../../../../constants';

const inspectJWTTooltipText = 'Decode JWT';

const jwtValidityStatus = message => message || '';

/* When the page is loaded for the first time, hydrate the header state from the localStorage
 * Keep syncing the localStorage state when user modifies.
 * */

class ApiRequest extends Component {
  constructor(props) {
    super(props);

    this.state = {
      endpointSectionIsOpen: getEndPointSectionIsOpen(),
      headersSectionIsOpen: getHeadersSectionIsOpen(),
      adminSecretVisible: false,
      isAnalyzingToken: false,
      analyzingHeaderRow: -1,
      tokenInfo: {
        header: {},
        payload: {},
        error: null,
        serverResp: {},
      },
    };

    if (this.props.numberOfTables !== 0) {
      const graphqlQueryInLS = window.localStorage.getItem('graphiql:query');
      if (graphqlQueryInLS && graphqlQueryInLS.indexOf('do not have') !== -1) {
        window.localStorage.removeItem('graphiql:query');
      }
    }

    this.analyzeBearerToken = this.analyzeBearerToken.bind(this);
    this.onAnalyzeBearerClose = this.onAnalyzeBearerClose.bind(this);
  }

  componentDidMount() {
    const handleHeaderInit = () => {
      const graphiqlHeaders =
        getPersistedGraphiQLHeaders() || getDefaultGraphiqlHeaders();

      // if admin secret is set and admin secret header was ever added to headers, add admin secret header if not already present
      const adminSecret = getAdminSecret();
      const adminSecretHeaderWasAdded = getPersistedAdminSecretHeaderWasAdded();
      if (adminSecret && !adminSecretHeaderWasAdded) {
        const headerKeys = graphiqlHeaders.map(h => h.key);

        // add admin secret header if not present
        if (!headerKeys.includes(ADMIN_SECRET_HEADER_KEY)) {
          graphiqlHeaders.push({
            key: ADMIN_SECRET_HEADER_KEY,
            value: adminSecret,
            isActive: true,
            isNewHeader: false,
            isDisabled: true,
          });
        }

        // set in local storage that admin secret header has been automatically added
        persistAdminSecretHeaderWasAdded();
      }

      // if admin secret is not set and admin secret header was ever added to headers, remove admin secret header if present
      if (!adminSecret && adminSecretHeaderWasAdded) {
        const headerKeys = graphiqlHeaders.map(h => h.key);

        // remove admin secret header if present
        const adminSecretHeaderIndex = headerKeys.indexOf(
          ADMIN_SECRET_HEADER_KEY
        );
        if (adminSecretHeaderIndex >= 0) {
          graphiqlHeaders.splice(adminSecretHeaderIndex, 1);
        }

        // remove from local storage that admin secret header has been automatically added
        removePersistedAdminSecretHeaderWasAdded();
      }

      // add an empty placeholder header
      graphiqlHeaders.push({
        key: '',
        value: '',
        isActive: true,
        isNewHeader: true,
        isDisabled: false,
      });

      // persist headers to local storage
      persistGraphiQLHeaders(graphiqlHeaders);

      // set headers in redux
      this.props.dispatch(setHeadersBulk(graphiqlHeaders));
    };

    handleHeaderInit();
  }

  onAnalyzeBearerClose() {
    this.setState({
      isAnalyzingToken: false,
      analyzingHeaderRow: -1,
    });
  }

  analyzeBearerToken(e) {
    const { dispatch } = this.props;

    const token = e.target.getAttribute('token');

    const analyzingHeaderRow = parseInt(
      e.target.getAttribute('data-header-index'),
      10
    );

    this.setState({
      isAnalyzingToken: true,
      analyzingHeaderRow,
      tokenInfo: {
        ...this.state.tokenInfo,
        serverResp: {},
        error: null,
      },
    });

    const decodeAndSetState = serverResp => {
      const decoded = jwt.decode(token, { complete: true });

      if (decoded) {
        this.setState({
          tokenInfo: {
            ...this.state.tokenInfo,
            header: decoded.header,
            payload: decoded.payload,
            error: null,
            serverResp: serverResp,
          },
        });
      } else {
        const message =
          'This JWT seems to be invalid. Please check the token value and try again!';

        this.setState({
          tokenInfo: {
            ...this.state.tokenInfo,
            error: message,
            serverResp: serverResp,
          },
        });
      }
    };

    if (token) {
      dispatch(verifyJWTToken(token))
        .then(data => {
          decodeAndSetState(data);
        })
        .catch(err => {
          decodeAndSetState(err);
        });
    }
  }

  render() {
    const { isAnalyzingToken, tokenInfo, analyzingHeaderRow } = this.state;

    const { is_jwt_set: isJWTSet = false } = this.props.serverConfig;

    const {
      error: tokenAnalyzeError,
      serverResp: tokenAnalyzeResp,
    } = tokenInfo;

    const getGraphQLEndpointBar = () => {
      const { endpointSectionIsOpen } = this.state;

      const toggleHandler = () => {
        const newIsOpen = !endpointSectionIsOpen;

        setEndPointSectionIsOpen(newIsOpen);

        this.setState({ endpointSectionIsOpen: newIsOpen });
      };

      return (
        <CollapsibleToggle
          title={'GraphQL Endpoint'}
          isOpen={endpointSectionIsOpen}
          toggleHandler={toggleHandler}
          useDefaultTitleStyle
        >
          <div
            id="stickyHeader"
            className={
              styles.apiPostRequestWrapper +
              ' ' +
              styles.wd100 +
              ' ' +
              styles.stickyHeader
            }
          >
            <div className={'col-xs-12 ' + styles.padd_remove}>
              <div
                className={
                  'input-group ' +
                  styles.inputGroupWrapper +
                  ' ' +
                  styles.cursorNotAllowed
                }
              >
                <div className={'input-group-btn ' + styles.inputGroupBtn}>
                  <button type="button" className={'btn btn-default'}>
                    {this.props.method}
                  </button>
                </div>
                <input
                  onChange={this.onUrlChanged}
                  value={this.props.url || ''}
                  type="text"
                  readOnly
                  className={styles.inputGroupInput + ' form-control '}
                />
              </div>
            </div>
            <div className={styles.stickySeparator} />
          </div>
        </CollapsibleToggle>
      );
    };

    const getHeaderTable = () => {
      const { headersSectionIsOpen, adminSecretVisible } = this.state;
      const getHeaderRows = () => {
        const headers = this.props.headers;

        const handleFocus = () => {
          this.props.dispatch(focusHeaderTextbox());
        };

        const handleBlur = () => {
          this.props.dispatch(unfocusTypingHeader());
        };

        const onDeleteHeaderClicked = e => {
          const index = parseInt(e.target.getAttribute('data-header-id'), 10);
          this.props
            .dispatch(removeRequestHeader(index))
            .then(r => persistGraphiQLHeaders(r));
        };

        const onHeaderValueChanged = e => {
          const index = parseInt(e.target.getAttribute('data-header-id'), 10);
          const key = e.target.getAttribute('data-element-name');
          const newValue = e.target.value;
          this.props
            .dispatch(changeRequestHeader(index, key, newValue, false))
            .then(r => persistGraphiQLHeaders(r));
        };

        const onShowAdminSecretClicked = () => {
          this.setState({ adminSecretVisible: !this.state.adminSecretVisible });
        };

        return headers.map((header, i) => {
          const isAdminSecret =
            header.key.toLowerCase() === ADMIN_SECRET_HEADER_KEY;

          const getHeaderActiveCheckBox = () => {
            let headerActiveCheckbox = null;

            if (!header.isNewHeader) {
              headerActiveCheckbox = (
                <td>
                  <input
                    type="checkbox"
                    name="sponsored"
                    className={styles.common_checkbox + ' common_checkbox'}
                    id={i + 1}
                    checked={header.isActive}
                    data-header-id={i}
                    onChange={onHeaderValueChanged}
                    data-element-name="isActive"
                  />
                  <label
                    htmlFor={i + 1}
                    className={
                      styles.common_checkbox_label + ' common_checkbox_label'
                    }
                  />
                </td>
              );
            }

            return headerActiveCheckbox;
          };

          const getColSpan = () => {
            return header.isNewHeader ? '2' : '1';
          };

          const getHeaderKey = () => {
            let className = '';
            if (header.isNewHeader) {
              className =
                styles.border_right +
                ' ' +
                styles.tableTdLeft +
                ' ' +
                styles.borderTop +
                ' ' +
                styles.tableEnterKey;
            } else {
              className = styles.border_right;
            }

            return (
              <td colSpan={getColSpan()} className={className}>
                <input
                  className={'form-control ' + styles.responseTableInput}
                  value={header.key || ''}
                  disabled={header.isDisabled === true}
                  data-header-id={i}
                  placeholder="Enter Key"
                  data-element-name="key"
                  onChange={onHeaderValueChanged}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  type="text"
                  data-test={`header-key-${i}`}
                />
              </td>
            );
          };

          const getHeaderValue = () => {
            let className = '';
            if (header.isNewHeader) {
              className =
                styles.borderTop +
                ' ' +
                styles.tableEnterKey +
                ' ' +
                styles.tableLastTd;
            }

            let type = 'text';
            if (isAdminSecret && !adminSecretVisible) {
              type = 'password';
            }

            return (
              <td colSpan={getColSpan()} className={className}>
                <input
                  className={'form-control ' + styles.responseTableInput}
                  value={header.value || ''}
                  disabled={header.isDisabled === true}
                  data-header-id={i}
                  placeholder="Enter Value"
                  data-element-name="value"
                  onChange={onHeaderValueChanged}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  data-test={`header-value-${i}`}
                  type={type}
                />
              </td>
            );
          };

          const getHeaderAdminVal = () => {
            let headerAdminVal = null;

            if (isAdminSecret) {
              headerAdminVal = (
                <Icon
                  type="eye"
                  data-header-id={i}
                  aria-hidden="true"
                  onClick={onShowAdminSecretClicked}
                  pointer
                />
              );
            }

            return headerAdminVal;
          };

          const getJWTInspectorIcon = () => {
            // Check whether key is Authorization and value starts with Bearer
            const { isAuthHeader, token } = parseAuthHeader(header);

            let inspectorIcon = null;

            const getAnalyzeIcon = () => {
              let analyzeIcon;

              if (isAnalyzingToken && analyzingHeaderRow === i) {
                analyzeIcon = (
                  <Spinner
                    size="lg"
                    display="inline-block"
                    className={styles.showInspectorLoading}
                  />
                );
              } else {
                analyzeIcon = (
                  <Icon
                    type="secret"
                    className={styles.showInspector}
                    token={token}
                    data-header-index={i}
                    onClick={this.analyzeBearerToken}
                  />
                );
              }

              return analyzeIcon;
            };

            if (isAuthHeader && isJWTSet) {
              inspectorIcon = (
                <ToolTip placement="top" message={inspectJWTTooltipText}>
                  {getAnalyzeIcon()}
                </ToolTip>
              );
            }

            return inspectorIcon;
          };

          const getHeaderRemoveBtn = () => {
            return (
              <Icon
                type="close"
                data-header-id={i}
                aria-hidden="true"
                onClick={onDeleteHeaderClicked}
                className={styles.closeHeader}
              />
            );
          };

          const getHeaderActions = () => {
            let headerActions = null;

            if (!header.isNewHeader) {
              headerActions = (
                <td>
                  {getHeaderAdminVal()}
                  {getJWTInspectorIcon()}
                  {getHeaderRemoveBtn()}
                </td>
              );
            }

            return headerActions;
          };

          return (
            <tr key={i}>
              {getHeaderActiveCheckBox()}
              {getHeaderKey()}
              {getHeaderValue()}
              {getHeaderActions()}
            </tr>
          );
        });
      };

      const toggleHandler = () => {
        const newIsOpen = !headersSectionIsOpen;

        setHeadersSectionIsOpen(newIsOpen);

        this.setState({ headersSectionIsOpen: newIsOpen });
      };

      return (
        <CollapsibleToggle
          title={'Request Headers'}
          testId="api-explorer-header"
          isOpen={headersSectionIsOpen}
          toggleHandler={toggleHandler}
          useDefaultTitleStyle
        >
          <div className={styles.responseTable + ' ' + styles.remove_all_pad}>
            <table className={'table ' + styles.tableBorder}>
              <thead>
                <tr>
                  <th className={styles.wd4 + ' ' + styles.headerHeading} />
                  <th
                    className={
                      styles.wd48 +
                      ' ' +
                      styles.border_right +
                      ' ' +
                      styles.headerHeading
                    }
                  >
                    Key
                  </th>
                  <th className={styles.wd48 + ' ' + styles.headerHeading}>
                    Value
                  </th>
                  <th className={styles.wd4 + ' ' + styles.headerHeading} />
                </tr>
              </thead>
              <tbody>{getHeaderRows()}</tbody>
            </table>
          </div>
        </CollapsibleToggle>
      );
    };

    const getRequestBody = () => {
      switch (this.props.bodyType) {
        case 'graphql':
          return (
            <div className={styles.add_mar_top}>
              <GraphiQLWrapper
                data={this.props}
                numberOfTables={this.props.numberOfTables}
                dispatch={this.props.dispatch}
                headerFocus={this.props.headerFocus}
                urlParams={this.props.urlParams}
              />
            </div>
          );
        default:
          return '';
      }
    };

    const getAnalyzeTokenModal = () => {
      const getAnalyzeBearerBody = () => {
        const {
          claims_namespace: claimNameSpace = 'https://hasura.io/jwt/claims',
          claims_format: claimFormat = 'json',
        } =
          this.props.serverConfig && this.props.serverConfig.jwt
            ? this.props.serverConfig.jwt
            : {};

        let tokenVerified = false;
        let JWTError = '';
        if (tokenAnalyzeResp && 'errors' in tokenAnalyzeResp) {
          try {
            JWTError =
              tokenAnalyzeResp.errors.length > 0
                ? tokenAnalyzeResp.errors[0].message
                : null;
          } catch (e) {
            JWTError = e.toString();
          }
        } else {
          tokenVerified = true;
        }

        const generateJWTVerificationStatus = () => {
          switch (true) {
            case tokenVerified:
              return (
                <ToolTip
                  placement="top"
                  message={jwtValidityStatus('Valid JWT token')}
                >
                  <Icon type="check" color="green.original" />
                </ToolTip>
              );
            case !tokenVerified && JWTError.length > 0:
              return <Icon type="close" color="red.primary" />;
            default:
              return null;
          }
        };

        const getJWTFailMessage = () => {
          if (!tokenVerified && JWTError.length > 0) {
            return (
              <div className={styles.jwt_verification_fail_message}>
                {JWTError}
              </div>
            );
          }
          return null;
        };

        const getHasuraClaims = () => {
          const payload = tokenInfo.payload;
          if (!payload) {
            return null;
          }
          const isValidPayload = Object.keys(payload).length;
          const payloadHasValidNamespace = claimNameSpace in payload;
          const isSupportedFormat =
            ['json', 'stringified_json'].indexOf(claimFormat) !== -1;

          if (
            !isValidPayload ||
            !payloadHasValidNamespace ||
            !isSupportedFormat
          ) {
            return null;
          }

          let claimData = '';

          const generateValidNameSpaceData = claimD => {
            return JSON.stringify(claimD, null, 2);
          };

          try {
            claimData =
              claimFormat === 'stringified_json'
                ? generateValidNameSpaceData(
                  JSON.parse(payload[claimNameSpace])
                )
                : generateValidNameSpaceData(payload[claimNameSpace]);
          } catch (e) {
            console.error(e);
            return null;
          }

          return [
            <br key="hasura_claim_element_break" />,
            <span key="hasura_claim_label" className={styles.analyzerLabel}>
              Hasura Claims:
              <span>hasura headers</span>
            </span>,
            <TextAreaWithCopy
              key="hasura_claim_value"
              copyText={claimData}
              textLanguage={'json'}
              id="claimNameSpaceCopy"
              containerId="claimNameSpaceCopyBlock"
            />,
            <br key="hasura_claim_element_break_after" />,
          ];
        };

        let analyzeBearerBody;

        if (tokenAnalyzeError) {
          analyzeBearerBody = <span>{tokenAnalyzeError}</span>;
        } else {
          analyzeBearerBody = (
            <div>
              <span className={styles.analyzerLabel}>
                Token Validity:
                <span className={styles.token_validity}>
                  {generateJWTVerificationStatus()}
                </span>
              </span>
              {getJWTFailMessage() || <br />}
              {getHasuraClaims() || <br />}
              <span className={styles.analyzerLabel}>
                Header:
                <span>Algorithm & Token Type</span>
              </span>
              <TextAreaWithCopy
                copyText={JSON.stringify(tokenInfo.header, null, 2)}
                textLanguage={'json'}
                id="headerCopy"
                containerId="headerCopyBlock"
              />
              <br />
              <span className={styles.analyzerLabel}>
                Full Payload:
                <span>Data</span>
              </span>
              <TextAreaWithCopy
                copyText={JSON.stringify(tokenInfo.payload, null, 2)}
                textLanguage={'json'}
                id="payloadCopy"
                containerId="payloadCopyBlock"
              />
            </div>
          );
        }

        return analyzeBearerBody;
      };

      return (
        <Modal
          show={
            isAnalyzingToken &&
            tokenAnalyzeResp &&
            Object.keys(tokenAnalyzeResp).length > 0
          }
          onClose={this.onAnalyzeBearerClose}
          customClass={styles.analyzerBearerModal}
          title={tokenAnalyzeError ? 'Error decoding JWT' : 'Decoded JWT'}
        >
          {getAnalyzeBearerBody()}
        </Modal>
      );
    };

    return (
      <div className={styles.apiRequestWrapper}>
        {getGraphQLEndpointBar()}
        {getHeaderTable()}
        {getRequestBody()}
        {isJWTSet && getAnalyzeTokenModal()}
      </div>
    );
  }
}

ApiRequest.propTypes = {
  method: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  headers: PropTypes.array,
  dataHeaders: PropTypes.array,
  params: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
  explorerData: PropTypes.object.isRequired,
  credentials: PropTypes.object.isRequired,
  bodyType: PropTypes.string.isRequired,
  route: PropTypes.object,
  numberOfTables: PropTypes.number.isRequired,
  headerFocus: PropTypes.bool.isRequired,
  urlParams: PropTypes.object.isRequired,
  consoleUrl: PropTypes.string.isRequired,
};

export default ApiRequest;
