import styled from 'styled-components';

import { BaseStyledDiv } from '../Common.style';

export const SpinnerStyles = styled(BaseStyledDiv)`
  position: relative;

  .sk_child {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
  }

  .sk_child:before {
    content: '';
    display: block;
    margin: 0 auto;
    width: 15%;
    height: 15%;
    border-radius: 100%;
    -webkit-animation: sk_circleBounceDelay 1.2s infinite ease-in-out both;
    animation: sk_circleBounceDelay 1.2s infinite ease-in-out both;

    background-color: #333;
  }

  .sk_circle2 {
    -webkit-transform: rotate(30deg);
    -ms-transform: rotate(30deg);
    transform: rotate(30deg);
  }

  .sk_circle3 {
    -webkit-transform: rotate(60deg);
    -ms-transform: rotate(60deg);
    transform: rotate(60deg);
  }

  .sk_circle4 {
    -webkit-transform: rotate(90deg);
    -ms-transform: rotate(90deg);
    transform: rotate(90deg);
  }

  .sk_circle5 {
    -webkit-transform: rotate(120deg);
    -ms-transform: rotate(120deg);
    transform: rotate(120deg);
  }

  .sk_circle6 {
    -webkit-transform: rotate(150deg);
    -ms-transform: rotate(150deg);
    transform: rotate(150deg);
  }

  .sk_circle7 {
    -webkit-transform: rotate(180deg);
    -ms-transform: rotate(180deg);
    transform: rotate(180deg);
  }

  .sk_circle8 {
    -webkit-transform: rotate(210deg);
    -ms-transform: rotate(210deg);
    transform: rotate(210deg);
  }

  .sk_circle9 {
    -webkit-transform: rotate(240deg);
    -ms-transform: rotate(240deg);
    transform: rotate(240deg);
  }

  .sk_circle10 {
    -webkit-transform: rotate(270deg);
    -ms-transform: rotate(270deg);
    transform: rotate(270deg);
  }

  .sk_circle11 {
    -webkit-transform: rotate(300deg);
    -ms-transform: rotate(300deg);
    transform: rotate(300deg);
  }

  .sk_circle12 {
    -webkit-transform: rotate(330deg);
    -ms-transform: rotate(330deg);
    transform: rotate(330deg);
  }

  .sk_circle2:before {
    -webkit-animation-delay: -1.1s;
    animation-delay: -1.1s;
  }

  .sk_circle3:before {
    -webkit-animation-delay: -1s;
    animation-delay: -1s;
  }

  .sk_circle4:before {
    -webkit-animation-delay: -0.9s;
    animation-delay: -0.9s;
  }

  .sk_circle5:before {
    -webkit-animation-delay: -0.8s;
    animation-delay: -0.8s;
  }

  .sk_circle6:before {
    -webkit-animation-delay: -0.7s;
    animation-delay: -0.7s;
  }

  .sk_circle7:before {
    -webkit-animation-delay: -0.6s;
    animation-delay: -0.6s;
  }

  .sk_circle8:before {
    -webkit-animation-delay: -0.5s;
    animation-delay: -0.5s;
  }

  .sk_circle9:before {
    -webkit-animation-delay: -0.4s;
    animation-delay: -0.4s;
  }

  .sk_circle10:before {
    -webkit-animation-delay: -0.3s;
    animation-delay: -0.3s;
  }

  .sk_circle11:before {
    -webkit-animation-delay: -0.2s;
    animation-delay: -0.2s;
  }

  .sk_circle12:before {
    -webkit-animation-delay: -0.1s;
    animation-delay: -0.1s;
  }

  @-webkit-keyframes sk_circleBounceDelay {
    0%,
    80%,
    100% {
      -webkit-transform: scale(0);
      transform: scale(0);
    }
    40% {
      -webkit-transform: scale(1);
      transform: scale(1);
    }
  }

  @keyframes sk_circleBounceDelay {
    0%,
    80%,
    100% {
      -webkit-transform: scale(0);
      transform: scale(0);
    }
    40% {
      -webkit-transform: scale(1);
      transform: scale(1);
    }
  }
`;
