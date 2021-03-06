import React from 'react';
import { connect } from 'react-redux';
import { Link as RouterLink } from 'react-router';
import { css } from 'styled-components';

import * as tooltips from './Tooltips';
import globals from '../../Globals';
import { getPathRoot } from '../Common/utils/urlUtils';

import {
  loadServerVersion,
  fetchServerConfig,
  loadLatestServerVersion,
  featureCompatibilityInit,
  emitProClickedEvent,
} from './Actions';

import {
  loadInconsistentObjects,
  redirectToMetadataStatus,
} from '../Services/Settings/Actions';

import {
  getLoveConsentState,
  setLoveConsentState,
  getProClickState,
  setProClickState,
} from './utils';

import { checkStableVersion, versionGT } from '../../helpers/versionUtils';
import { getSchemaBaseRoute } from '../Common/utils/routesUtils';
import {
  getLocalStorageItem,
  LS_VERSION_UPDATE_CHECK_LAST_CLOSED,
  setLocalStorageItem,
} from '../Common/utils/localStorageUtils';
import { setPreReleaseNotificationOptOutInDB } from '../../telemetry/Actions';

import { Icon, Spinner, ToolTip, Text, Link } from '../UIKit/atoms/';
import styles from './Main.scss';

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      updateNotificationVersion: null,
      loveConsentState: getLoveConsentState(),
      proClickState: getProClickState(),
      isPopUpOpen: false,
    };

    this.handleBodyClick = this.handleBodyClick.bind(this);
  }

  componentDidMount() {
    const { dispatch } = this.props;

    document
      .querySelector('body')
      .addEventListener('click', this.handleBodyClick);

    dispatch(loadServerVersion()).then(() => {
      dispatch(featureCompatibilityInit());

      dispatch(loadInconsistentObjects({ shouldReloadMetadata: false })).then(
        () => {
          this.handleMetadataRedirect();
        }
      );

      dispatch(loadLatestServerVersion()).then(() => {
        this.setShowUpdateNotification();
      });
    });

    dispatch(fetchServerConfig());
  }

  toggleProPopup() {
    const { dispatch } = this.props;
    dispatch(emitProClickedEvent({ open: !this.state.isPopUpOpen }));
    this.setState({ isPopUpOpen: !this.state.isPopUpOpen });
  }

  setShowUpdateNotification() {
    const {
      latestStableServerVersion,
      latestPreReleaseServerVersion,
      serverVersion,
      console_opts,
    } = this.props;

    const allowPreReleaseNotifications =
      !console_opts || !console_opts.disablePreReleaseUpdateNotifications;

    let latestServerVersionToCheck;
    if (
      allowPreReleaseNotifications &&
      versionGT(latestPreReleaseServerVersion, latestStableServerVersion)
    ) {
      latestServerVersionToCheck = latestPreReleaseServerVersion;
    } else {
      latestServerVersionToCheck = latestStableServerVersion;
    }

    try {
      const lastUpdateCheckClosed = getLocalStorageItem(
        LS_VERSION_UPDATE_CHECK_LAST_CLOSED
      );

      if (lastUpdateCheckClosed !== latestServerVersionToCheck) {
        const isUpdateAvailable = versionGT(
          latestServerVersionToCheck,
          serverVersion
        );

        if (isUpdateAvailable) {
          this.setState({
            updateNotificationVersion: latestServerVersionToCheck,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  handleBodyClick(e) {
    const heartDropDown = document.getElementById('dropdown_wrapper');
    const heartDropDownOpen = document.querySelectorAll(
      '#dropdown_wrapper.open'
    );

    if (
      heartDropDown &&
      !heartDropDown.contains(e.target) &&
      heartDropDownOpen.length !== 0
    ) {
      heartDropDown.classList.remove('open');
    }
  }

  handleDropdownToggle() {
    document.getElementById('dropdown_wrapper').classList.toggle('open');
  }

  handleMetadataRedirect() {
    if (this.props.metadata.inconsistentObjects.length > 0) {
      this.props.dispatch(redirectToMetadataStatus());
    }
  }

  closeLoveIcon() {
    const s = {
      isDismissed: true,
    };
    setLoveConsentState(s);
    this.setState({
      loveConsentState: { ...getLoveConsentState() },
    });
  }

  updateLocalStorageState() {
    const s = getProClickState();
    if (s && 'isProClicked' in s && !s.isProClicked) {
      setProClickState({
        isProClicked: !s.isProClicked,
      });
      this.setState({
        proClickState: { ...getProClickState() },
      });
    }
  }

  clickProIcon() {
    this.updateLocalStorageState();
    this.toggleProPopup();
  }

  closeUpdateBanner() {
    const { updateNotificationVersion } = this.state;
    setLocalStorageItem(
      LS_VERSION_UPDATE_CHECK_LAST_CLOSED,
      updateNotificationVersion
    );
    this.setState({ updateNotificationVersion: null });
  }

  render() {
    const {
      children,
      location,
      migrationModeProgress,
      currentSchema,
      serverVersion,
      metadata,
      dispatch,
    } = this.props;

    const { isProClicked } = this.state.proClickState;

    const appPrefix = '';

    const logo = require('./images/white-logo.svg');
    const github = require('./images/Github.svg');
    const discord = require('./images/Discord.svg');
    const mail = require('./images/mail.svg');
    const docs = require('./images/docs-logo.svg');
    const about = require('./images/console-logo.svg');
    const pixHeart = require('./images/pix-heart.svg');
    const close = require('./images/x-circle.svg');
    const monitoring = require('./images/monitoring.svg');
    const rate = require('./images/rate.svg');
    const regression = require('./images/regression.svg');
    const management = require('./images/management.svg');
    const allow = require('./images/allow.svg');
    const arrowForwardRed = require('./images/arrow_forward-red.svg');
    const currentLocation = location.pathname;
    const currentActiveBlock = getPathRoot(currentLocation);

    const getMainContent = () => {
      let mainContent = null;

      if (!migrationModeProgress) {
        mainContent = children && React.cloneElement(children);
      } else {
        mainContent = <Spinner size="xl" my="100px" mx="auto" />;
      }

      return mainContent;
    };

    const getSettingsSelectedMarker = () => {
      let metadataSelectedMarker = null;

      if (currentActiveBlock === 'settings') {
        metadataSelectedMarker = <span className={styles.selected} />;
      }

      return metadataSelectedMarker;
    };

    const getMetadataStatusIcon = () => {
      if (metadata.inconsistentObjects.length === 0) {
        return <Icon type="settings" color="white" />;
      }

      return (
        <div>
          <Icon type="settings" />
          <div className={styles.overlappingExclamation}>
            <div className={styles.iconWhiteBackground} />
            <Icon type="default" />
          </div>
        </div>
      );
    };

    const getAdminSecretSection = () => {
      let adminSecretHtml = null;

      if (!globals.isAdminSecretSet) {
        adminSecretHtml = (
          <Link
            href="https://hasura.io/docs/1.0/graphql/manual/deployment/securing-graphql-endpoint.html"
            target="_blank"
            color="white"
            display="block"
            pr="15px"
            pt="1px"
            height="100%"
            fontWeight="bold"
            css={css`
              display: flex;
              align-items: center;

              &:hover {
                color: #fff;
                opacity: 0.8;
              }
            `}
          >
            <ToolTip message={tooltips.secureEndpoint} placement="left">
              <Icon type="warning" size={12} mr="sm" />
            </ToolTip>
            Secure your endpoint
          </Link>
        );
      }

      return adminSecretHtml;
    };

    const getUpdateNotification = () => {
      let updateNotificationHtml = null;

      const { updateNotificationVersion } = this.state;

      const isStableRelease = checkStableVersion(updateNotificationVersion);

      const getPreReleaseNote = () => {
        const handlePreRelNotifOptOut = e => {
          e.preventDefault();
          e.stopPropagation();

          this.closeUpdateBanner();

          dispatch(setPreReleaseNotificationOptOutInDB());
        };

        return (
          <React.Fragment>
            <span className={styles.middot}> &middot; </span>
            <i>
              This is a pre-release version. Not recommended for production use.
              <span className={styles.middot}> &middot; </span>
              <Link
                href={'#'}
                onClick={handlePreRelNotifOptOut}
                underline
                color="black.text"
              >
                Opt out of pre-release notifications
              </Link>
              <ToolTip
                message={'Only be notified about stable releases'}
                placement="top"
                ml="sm"
              />
            </i>
          </React.Fragment>
        );
      };

      if (updateNotificationVersion) {
        updateNotificationHtml = (
          <div>
            <div className={styles.phantom} />{' '}
            {/* phantom div to prevent overlapping of banner with content. */}
            <div className={styles.updateBannerWrapper}>
              <div className={styles.updateBanner}>
                <Text> Hey there! A new server version </Text>
                <Text fontWeight="bold" mx="6px" pb="3px">
                  {updateNotificationVersion}
                </Text>
                <Text>is available</Text>
                <span className={styles.middot}> &middot; </span>
                <Link
                  href={
                    'https://github.com/hasura/graphql-engine/releases/tag/' +
                    updateNotificationVersion
                  }
                  target="_blank"
                  underline
                  color="black.text"
                >
                  <span>View Changelog</span>
                </Link>
                <span className={styles.middot}> &middot; </span>
                <Link
                  href="https://hasura.io/docs/1.0/graphql/manual/deployment/updating.html"
                  target="_blank"
                  underline
                  color="black.text"
                >
                  <span>Update Now</span>
                </Link>
                {!isStableRelease && getPreReleaseNote()}
                <span
                  className={styles.updateBannerClose}
                  onClick={this.closeUpdateBanner.bind(this)}
                >
                  <Icon type="close" pointer />
                </span>
              </div>
            </div>
          </div>
        );
      }

      return updateNotificationHtml;
    };

    const getLoveSection = () => {
      let loveSectionHtml = null;

      if (!this.state.loveConsentState.isDismissed) {
        loveSectionHtml = [
          <div
            key="main_love_1"
            className={styles.shareSection + ' dropdown-toggle'}
            aria-expanded="false"
            onClick={this.handleDropdownToggle.bind(this)}
          >
            <img
              className={'img-responsive'}
              src={pixHeart}
              alt={'pix Heart'}
            />
          </div>,
          <ul
            key="main_love_2"
            className={'dropdown-menu ' + styles.dropdown_menu}
          >
            <div className={styles.dropdown_menu_container}>
              <Icon
                type="close"
                onClick={this.closeLoveIcon.bind(this)}
                pointer
                color="black.secondary"
                position="absolute"
                top="10px"
                left="20px"
              />
              <div className={styles.displayFlex}>
                <li className={styles.pixelText1}>
                  Roses are red, <br />
                  Violets are blue;
                  <br />
                  Star us on GitHub,
                  <br />
                  To make our <Icon type="love" size={10} mx="xs" /> go wooooo!
                </li>
                <li className={'dropdown-item'}>
                  <Link
                    href="https://github.com/hasura/graphql-engine"
                    target="_blank"
                    color="black.text"
                  >
                    <div className={styles.socialIcon}>
                      <img
                        className="img img-responsive"
                        src={`${globals.assetsPath}/common/img/githubicon.png`}
                        alt={'GitHub'}
                      />
                    </div>
                    <div className={styles.pixelText}>
                      <Icon type="star" size={12} mr="5px" />
                      Star
                    </div>
                  </Link>
                  {/*
                          <div className={styles.gitHubBtn}>
                            <iframe
                              title="github"
                              src="https://ghbtns.com/github-btn.html?user=hasura&repo=graphql-engine&type=star&count=true"
                              frameBorder="0"
                              scrolling="0"
                              width="100px"
                              height="30px"
                            />
                          </div>
                          */}
                </li>
                <li className={'dropdown-item '}>
                  <Link
                    href="https://twitter.com/intent/tweet?hashtags=graphql,postgres&text=Just%20deployed%20a%20GraphQL%20backend%20with%20@HasuraHQ!%20%E2%9D%A4%EF%B8%8F%20%F0%9F%9A%80%0Ahttps://github.com/hasura/graphql-engine%0A"
                    target="_blank"
                    color="black.text"
                  >
                    <div className={styles.socialIcon}>
                      <img
                        className="img img-responsive"
                        src={`${globals.assetsPath}/common/img/twittericon.png`}
                        alt={'Twitter'}
                      />
                    </div>
                    <div className={styles.pixelText}>
                      <Icon type="twitter" size={12} mr="5px" />
                      Tweet
                    </div>
                  </Link>
                </li>
              </div>
            </div>
          </ul>,
        ];
      }

      return loveSectionHtml;
    };

    const getHelpDropdownPosStyle = () => {
      let helpDropdownPosStyle = '';

      if (this.state.loveConsentState.isDismissed) {
        helpDropdownPosStyle = styles.help_dropdown_menu_heart_dismissed;
      }

      return helpDropdownPosStyle;
    };

    const getSidebarItem = (
      title,
      icon,
      tooltipText,
      path,
      isDefault = false
    ) => {
      const block = getPathRoot(path);

      return (
        <ToolTip message={tooltipText} height="100%">
          <li>
            <RouterLink
              className={
                currentActiveBlock === block ||
                (isDefault && currentActiveBlock === '')
                  ? styles.navSideBarActive
                  : ''
              }
              to={appPrefix + path}
            >
              <Icon
                type={icon}
                data-test={block}
                css={
                  icon === 'schema'
                    ? css`
                        transform: rotate(45deg);
                      `
                    : ''
                }
                mr="xs"
              />
              <Text>{title}</Text>
            </RouterLink>
          </li>
        </ToolTip>
      );
    };

    const renderProPopup = () => {
      const { isPopUpOpen } = this.state;

      if (isPopUpOpen) {
        return (
          <div className={styles.proPopUpWrapper}>
            <div className={styles.popUpHeader}>
              Hasura <span>PRO</span>
              <img
                onClick={this.toggleProPopup.bind(this)}
                className={styles.popUpClose}
                src={close}
                alt={'Close'}
              />
            </div>
            <div className={styles.popUpBodyWrapper}>
              <div className={styles.featuresDescription}>
                Hasura Pro is an enterprise-ready version of Hasura that comes
                with the following features:
              </div>
              <div className={styles.proFeaturesList}>
                <div className={styles.featuresImg}>
                  <img src={monitoring} alt={'Monitoring'} />
                </div>
                <div className={styles.featuresList}>
                  <div className={styles.featuresTitle}>
                    Monitoring/Analytics
                  </div>
                  <div className={styles.featuresDescription}>
                    Complete observability to troubleshoot errors and drill-down
                    into individual operations.
                  </div>
                </div>
              </div>
              <div className={styles.proFeaturesList}>
                <div className={styles.featuresImg}>
                  <img src={rate} alt={'Rate'} />
                </div>
                <div className={styles.featuresList}>
                  <div className={styles.featuresTitle}>Rate Limiting</div>
                  <div className={styles.featuresDescription}>
                    Prevent abuse with role-based rate limits.
                  </div>
                </div>
              </div>
              <div className={styles.proFeaturesList}>
                <div className={styles.featuresImg}>
                  <img src={regression} alt={'Regression'} />
                </div>
                <div className={styles.featuresList}>
                  <div className={styles.featuresTitle}>Regression Testing</div>
                  <div className={styles.featuresDescription}>
                    Automatically create regression suites to prevent breaking
                    changes.
                  </div>
                </div>
              </div>
              <div className={styles.proFeaturesList}>
                <div className={styles.featuresImg}>
                  <img src={management} alt={'Management'} />
                </div>
                <div className={styles.featuresList}>
                  <div className={styles.featuresTitle}>Team Management</div>
                  <div className={styles.featuresDescription}>
                    Login to a Hasura project with granular privileges.
                  </div>
                </div>
              </div>
              <div className={styles.proFeaturesList}>
                <div className={styles.featuresImg}>
                  <img src={allow} alt={'allow'} />
                </div>
                <div className={styles.featuresList}>
                  <div className={styles.featuresTitle}>
                    Allow Listing Workflows
                  </div>
                  <div className={styles.featuresDescription}>
                    Setup allow lists across dev, staging and production
                    environments with easy workflows.
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.popUpFooter}>
              <Link
                href={
                  'https://hasura.io/getintouch?type=hasuraprodemo&utm_source=console'
                }
                target={'_blank'}
                color="red.primary"
              >
                Set up a chat to learn more{' '}
                <img
                  className={styles.arrow}
                  src={arrowForwardRed}
                  alt={'Arrow'}
                />
              </Link>
            </div>
          </div>
        );
      }

      return null;
    };

    return (
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <div className={styles.header_logo_wrapper}>
            <div className={styles.logoParent}>
              <div className={styles.logo}>
                <RouterLink to="/">
                  <img className="img img-responsive" src={logo} />
                </RouterLink>
              </div>
              <RouterLink to="/">
                <div className={styles.project_version}>{serverVersion}</div>
              </RouterLink>
            </div>
          </div>
          <div className={styles.navigation_wrapper}>
            <ul className={styles.sidebarItems}>
              {getSidebarItem(
                'GraphiQL',
                'graphiQL',
                tooltips.apiExplorer,
                '/api-explorer',
                true
              )}
              {getSidebarItem(
                'Data',
                'database',
                tooltips.data,
                getSchemaBaseRoute(currentSchema)
              )}
              {getSidebarItem(
                'Actions',
                'action',
                tooltips.actions,
                '/actions/manage/actions'
              )}
              {getSidebarItem(
                'Remote Schemas',
                'schema',
                tooltips.remoteSchema,
                '/remote-schemas/manage/schemas'
              )}
              {getSidebarItem(
                'Events',
                'event',
                tooltips.events,
                '/events/manage/triggers'
              )}
            </ul>
            <div id="dropdown_wrapper" className={styles.clusterInfoWrapper}>
              {getAdminSecretSection()}
              <div className={styles.helpSection + ' ' + styles.proWrapper}>
                <span
                  className={
                    !isProClicked ? styles.proName : styles.proNameClicked
                  }
                  onClick={this.clickProIcon.bind(this)}
                >
                  PRO
                </span>
                {renderProPopup()}
              </div>
              <RouterLink to="/settings">
                <div className={styles.helpSection + ' ' + styles.settingsIcon}>
                  {getMetadataStatusIcon()}
                  {getSettingsSelectedMarker()}
                </div>
              </RouterLink>
              <div className={styles.supportSection}>
                <div
                  id="help"
                  className={styles.helpSection}
                  data-toggle="dropdown"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <Icon
                    type="question"
                    pointer
                    size={12}
                    color="white"
                    mr="sm"
                  />
                </div>
                <ul
                  className={
                    'dropdown-menu ' +
                    styles.help_dropdown_menu +
                    ' ' +
                    getHelpDropdownPosStyle()
                  }
                  aria-labelledby="help"
                >
                  <div className={styles.help_dropdown_menu_container}>
                    <li className={'dropdown-item'}>
                      <Link
                        href="https://github.com/hasura/graphql-engine/issues"
                        target="_blank"
                      >
                        <img
                          className={'img-responsive'}
                          src={github}
                          alt={'github'}
                        />
                        <span>Report bugs & suggest improvements</span>
                      </Link>
                    </li>
                    <li className={'dropdown-item'}>
                      <Link
                        href="https://discordapp.com/invite/vBPpJkS"
                        target="_blank"
                      >
                        <img
                          className={'img-responsive'}
                          src={discord}
                          alt={'discord'}
                        />
                        <span>Join discord community forum</span>
                      </Link>
                    </li>
                    <li className={'dropdown-item'}>
                      <Link href="mailto:support@hasura.io">
                        <img
                          className={'img-responsive'}
                          src={mail}
                          alt={'mail'}
                        />
                        <span>Reach out ({'support@hasura.io'})</span>
                      </Link>
                    </li>
                    <li className={'dropdown-item'}>
                      <Link href="https://hasura.io/docs/" target="_blank">
                        <img
                          className={'img-responsive'}
                          src={docs}
                          alt={'docs'}
                        />
                        <span>Head to docs</span>
                      </Link>
                    </li>
                    <li className={'dropdown-item'}>
                      <RouterLink to="/about">
                        <img
                          className={'img-responsive'}
                          src={about}
                          alt={'about'}
                        />
                        <span>About</span>
                      </RouterLink>
                    </li>
                  </div>
                </ul>
              </div>

              {getLoveSection()}
            </div>
          </div>
        </div>

        <div className={styles.main + ' container-fluid'}>
          {getMainContent()}
        </div>

        {getUpdateNotification()}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    ...state.main,
    header: { ...state.header },
    pathname: ownProps.location.pathname,
    currentSchema: state.tables.currentSchema,
    metadata: state.metadata,
    console_opts: state.telemetry.console_opts,
  };
};

export default connect(mapStateToProps)(Main);
