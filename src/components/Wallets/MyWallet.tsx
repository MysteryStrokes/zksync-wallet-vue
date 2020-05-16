import React, { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import makeBlockie from 'ethereum-blockies-base64';
import { observer } from 'mobx-react-lite';

import avatar from 'images/avatar.png';
import Spinner from 'components/Spinner/Spinner';
import SpinnerWorm from 'components/Spinner/SpinnerWorm';
import { Transition } from 'components/Transition/Transition';

import { useTimeout } from 'hooks/timers';
import { useMobxEffect } from 'src/hooks/useMobxEffect';
import { useStore } from 'src/store/context';

import { IMyWalletProps } from './Types';

import { WIDTH_BP } from 'constants/magicNumbers';

import './Wallets.scss';

const MyWallet: React.FC<IMyWalletProps> = observer(
  ({ price, setTransactionType }): JSX.Element => {
    const store = useStore();

    const {
      transactionModal,
      zkBalances,
      zkBalancesLoaded,
      verifyToken,
      zkWallet,
    } = store;

    const body = document.getElementById('body');

    const [isCopyModal, openCopyModal] = useState<boolean>(false);
    const [isBalancesListOpen, openBalancesList] = useState<boolean>(false);
    const [isAssetsOpen, openAssets] = useState<boolean>(false);
    const [selectedBalance, setSelectedBalance] = useState<any>();
    const [symbolName, setSymbolName] = useState<any>(
      !!zkBalances?.length ? zkBalances[0].symbol : '',
    );
    const [verified, setVerified] = useState<any>();
    const [walletBalance, setWalletBalance] = useState<string>('');

    const verifiedState =
      verified && !!zkBalances.length
        ? +parseFloat(walletBalance).toFixed(20) !==
          +(verified[selectedBalance] / Math.pow(10, 18)).toFixed(10)
        : false;

    const inputRef: (HTMLInputElement | null)[] = [];

    const history = useHistory();

    const handleCopy = useCallback(
      address => {
        if (navigator.userAgent.match(/ipad|iphone/i)) {
          const input: any = document.getElementsByClassName(
            'copy-block-input',
          )[0];
          const range = document.createRange();
          range.selectNodeContents(input);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          input.setSelectionRange(0, 999999);
          document.execCommand('copy');
        } else {
          inputRef.map(el => {
            if (address === el?.value) {
              el?.focus();
              el?.select();
              document.execCommand('copy');
            }
          });
        }
        openCopyModal(true);
      },
      [inputRef],
    );

    useTimeout(() => isCopyModal && openCopyModal(false), 2000, [isCopyModal]);

    const handleSelect = useCallback(
      name => {
        setSelectedBalance(name);
      },
      [setSelectedBalance],
    );

    const handleClickOutside = useCallback(
      e => {
        if (e.target.getAttribute('data-name')) {
          e.stopPropagation();
          openBalancesList(false);
          body?.classList.remove('fixed-b');
          openAssets(false);
        }
      },
      [body],
    );

    useMobxEffect(() => {
      document.addEventListener('click', handleClickOutside, true);
      return () => {
        document.removeEventListener('click', handleClickOutside, true);
      };
    }, [
      body,
      handleClickOutside,
      isBalancesListOpen,
      setSelectedBalance,
      setWalletBalance,
      verifyToken,
    ]);

    return (
      <div
        className={`mywallet-wrapper ${
          !!transactionModal?.title ? 'closed' : 'open'
        }`}
      >
        <h2 className='mywallet-title'>{'My wallet'}</h2>
        <div
          onClick={() => handleCopy(zkWallet?.address())}
          className='copy-block'
        >
          <Transition type='fly' timeout={200} trigger={isCopyModal}>
            <div className={'hint-copied open'}>
              <p>{'Copied!'}</p>
            </div>
          </Transition>
          <input
            type='text'
            className='copy-block-input'
            readOnly
            value={zkWallet?.address().toString() || ''}
            ref={e => inputRef.push(e)}
          />
          <div className='copy-block-left'>
            <img
              src={zkWallet ? makeBlockie(zkWallet.address()) : avatar}
              alt='avatar'
            />{' '}
            <p>
              {window?.innerWidth > WIDTH_BP
                ? zkWallet?.address()
                : zkWallet
                    ?.address()
                    .replace(
                      zkWallet
                        ?.address()
                        .slice(14, zkWallet?.address().length - 4),
                      '...',
                    )}
            </p>
          </div>
          <button
            className='copy-block-button btn-tr'
            onClick={() => handleCopy(zkWallet?.address())}
          ></button>
        </div>
        <div
          className={`mywallet-currency-block ${
            price && !!price.length ? '' : 'none'
          } ${verifiedState ? 'unverified' : ''} ${
            isBalancesListOpen ? 'borderless' : ''
          }`}
        >
          <div
            data-name='custom-selector'
            className={`mywallet-currency-block-shadow ${
              isBalancesListOpen ? 'open' : 'closed'
            }`}
          ></div>
          <div className='mywallet-currency-wrapper'>
            <div className='custom-selector balances mywallet'>
              <div
                onClick={() => {
                  openAssets(true);
                  if (body) {
                    body.classList.add('fixed-b');
                  }
                }}
                className={`custom-selector-title ${
                  !zkBalances.length && zkBalancesLoaded ? '' : ''
                }`}
              >
                {symbolName ? (
                  <p>zk{symbolName}</p>
                ) : (
                  <p>
                    {!!zkBalances.length &&
                      (selectedBalance?.symbol ? (
                        <span>zk{selectedBalance?.symbol}</span>
                      ) : (
                        <span>zk{zkBalances[0].symbol}</span>
                      ))}
                    {!zkBalances.length &&
                      (!zkBalancesLoaded ? (
                        <Spinner />
                      ) : (
                        <span>{'zkETH'}</span>
                      ))}
                  </p>
                )}
                <div className='arrow-down'></div>
              </div>
            </div>
          </div>
          <div className='mywallet-price-wrapper'>
            {verified && verifiedState && <SpinnerWorm />}
            <span className='mywallet-price'>
              {'~'}
              {parseFloat((+walletBalance).toFixed(2).toString())}
              {' USD'}
            </span>
          </div>
        </div>
        {!!zkBalances?.length && zkBalancesLoaded && (
          <>
            <div
              className={`mywallet-buttons-container ${
                price && !!price.length ? '' : 'none'
              }`}
            >
              <button
                onClick={() => {
                  setTransactionType('deposit');
                  history.push('/deposit');
                }}
                className='btn deposit-button btn-tr'
              >
                <span></span>
                {' Deposit'}
              </button>
              <button
                onClick={() => {
                  setTransactionType('withdraw');
                  history.push('/withdraw');
                }}
                className='btn withdraw-button btn-tr'
              >
                <span></span>
                {' Withdraw'}
              </button>
            </div>
            <button
              className='btn submit-button'
              onClick={() => {
                setTransactionType('transfer');
                history.push('/send');
              }}
            >
              <span className='send-icon'></span>
              {' Send'}
            </button>
          </>
        )}
        {!zkBalances?.length && zkBalancesLoaded && (
          <>
            <div
              className={`mywallet-buttons-container ${
                price && !!price.length ? '' : 'none'
              }`}
            >
              <p>
                {
                  'No balances yet, please make a deposit or request money from someone!'
                }
              </p>
            </div>
            <button
              onClick={() => {
                setTransactionType('deposit');
                history.push('/deposit');
              }}
              className='btn deposit-button btn-tr big'
            >
              <span></span>
              {' Deposit'}
            </button>
          </>
        )}
        {!zkBalancesLoaded && <Spinner />}
      </div>
    );
  },
);

export default MyWallet;
