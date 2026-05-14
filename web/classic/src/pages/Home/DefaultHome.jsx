/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Typography } from '@douyinfe/semi-ui';
import {
  IconCopy,
  IconFile,
  IconGithubLogo,
  IconPlay,
} from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { StatusContext } from '../../context/Status';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const DefaultHome = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const isMobile = useIsMobile();
  const docsLink = statusState?.status?.docs_link || '';
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;
  const serverAddress =
    statusState?.status?.server_address || `${window.location.origin}`;
  const isChinese = i18n.language.startsWith('zh');

  const handleCopyBaseURL = async () => {
    try {
      await navigator.clipboard.writeText(serverAddress);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = serverAddress;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className='w-full overflow-x-hidden'>
      <div className='w-full border-b border-semi-color-border min-h-[500px] md:min-h-[600px] lg:min-h-[700px] relative overflow-x-hidden'>
        <div className='blur-ball blur-ball-indigo' />
        <div className='blur-ball blur-ball-teal' />
        <div className='flex items-center justify-center h-full px-4 py-20 md:py-24 lg:py-32 mt-10'>
          <div className='flex flex-col items-center justify-center text-center max-w-4xl mx-auto'>
            <div className='flex flex-col items-center justify-center mb-6 md:mb-8'>
              <h1
                className={`text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-semi-color-text-0 leading-tight ${isChinese ? 'tracking-wide md:tracking-wider' : ''}`}
              >
                {t('统一的')}
                <br />
                <span className='shine-text'>{t('大模型接口网关')}</span>
              </h1>
              <p className='text-base md:text-lg lg:text-xl text-semi-color-text-1 mt-4 md:mt-6 max-w-xl'>
                {t('更好的价格，更好的稳定性，只需要将模型基址替换为：')}
              </p>
              <div className='flex items-center justify-center gap-4 w-full mt-4 md:mt-6 max-w-md'>
                <Input
                  readonly
                  value={serverAddress}
                  className='flex-1 !rounded-full'
                  size={isMobile ? 'default' : 'large'}
                  suffix={
                    <Button
                      type='primary'
                      onClick={handleCopyBaseURL}
                      icon={<IconCopy />}
                      className='!rounded-full'
                    />
                  }
                />
              </div>
            </div>

            <div className='flex flex-row gap-4 justify-center items-center'>
              <Link to='/console'>
                <Button
                  theme='solid'
                  type='primary'
                  size={isMobile ? 'default' : 'large'}
                  className='!rounded-3xl px-8 py-2'
                  icon={<IconPlay />}
                >
                  {t('获取密钥')}
                </Button>
              </Link>
              {isDemoSiteMode && statusState?.status?.version ? (
                <Button
                  size={isMobile ? 'default' : 'large'}
                  className='flex items-center !rounded-3xl px-6 py-2'
                  icon={<IconGithubLogo />}
                  onClick={() =>
                    window.open(
                      'https://github.com/QuantumNous/new-api',
                      '_blank',
                    )
                  }
                >
                  {statusState.status.version}
                </Button>
              ) : (
                docsLink && (
                  <Button
                    size={isMobile ? 'default' : 'large'}
                    className='flex items-center !rounded-3xl px-6 py-2'
                    icon={<IconFile />}
                    onClick={() => window.open(docsLink, '_blank')}
                  >
                    {t('文档')}
                  </Button>
                )
              )}
            </div>

            <Typography.Text type='tertiary' className='mt-12 text-lg block'>
              {t('支持众多的大模型供应商')}
            </Typography.Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultHome;
