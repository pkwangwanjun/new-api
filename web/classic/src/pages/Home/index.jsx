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

import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useActualTheme } from '../../context/Theme';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { normalizeLanguage } from '../../i18n/language';
import {
  getLocalizedCustomContent,
  isExternalLinkContent,
  looksLikeHtmlContent,
} from '../../helpers/utils';

const DefaultHome = lazy(() => import('./DefaultHome'));
const MarkdownHomeContent = lazy(() => import('./MarkdownHomeContent'));
const NoticeModal = lazy(() => import('../../components/layout/NoticeModal'));

function getCachedHomePageContent() {
  return (
    localStorage.getItem('home_page_content_raw') ||
    localStorage.getItem('home_page_content') ||
    ''
  );
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });
  return res.json();
}

const Home = () => {
  const { i18n } = useTranslation();
  const actualTheme = useActualTheme();
  const isMobile = useIsMobile();
  const [homePageContentRaw, setHomePageContentRaw] = useState(
    getCachedHomePageContent,
  );
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(
    () => getCachedHomePageContent() !== '',
  );
  const [noticeVisible, setNoticeVisible] = useState(false);
  const currentLanguage = normalizeLanguage(i18n.language) || 'zh-CN';
  const iframeRef = useRef(null);

  const homePageSource = useMemo(
    () => getLocalizedCustomContent(homePageContentRaw, currentLanguage),
    [homePageContentRaw, currentLanguage],
  );

  const isIframeHomePage = useMemo(
    () => isExternalLinkContent(homePageSource),
    [homePageSource],
  );

  const isHtmlHomePage = useMemo(
    () => looksLikeHtmlContent(homePageSource),
    [homePageSource],
  );

  useEffect(() => {
    let cancelled = false;

    const loadHomePageContent = async () => {
      try {
        const { success, data } = await fetchJson('/api/home_page_content');
        if (cancelled) return;
        if (success) {
          const nextContent = data || '';
          setHomePageContentRaw(nextContent);
          localStorage.setItem('home_page_content_raw', nextContent);
          localStorage.setItem('home_page_content', nextContent);
        }
      } catch (error) {
        console.error('Failed to load home page content:', error);
      } finally {
        if (!cancelled) {
          setHomePageContentLoaded(true);
        }
      }
    };

    loadHomePageContent();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate === today) return;

      try {
        const { success, data } = await fetchJson('/api/notice');
        if (!cancelled && success && data && data.trim() !== '') {
          setNoticeVisible(true);
        }
      } catch (error) {
        console.error('Failed to load notice:', error);
      }
    };

    checkNoticeAndShow();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isIframeHomePage) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    const syncIframeContext = () => {
      iframe.contentWindow?.postMessage({ themeMode: actualTheme }, '*');
      iframe.contentWindow?.postMessage({ lang: currentLanguage }, '*');
    };

    iframe.addEventListener('load', syncIframeContext);
    syncIframeContext();

    return () => {
      iframe.removeEventListener('load', syncIframeContext);
    };
  }, [actualTheme, currentLanguage, isIframeHomePage, homePageSource]);

  const renderHomeContent = () => {
    if (!homePageContentLoaded && !homePageSource) {
      return <div className='min-h-[55vh]' />;
    }

    if (!homePageSource) {
      return (
        <Suspense fallback={<div className='min-h-[55vh]' />}>
          <DefaultHome />
        </Suspense>
      );
    }

    if (isIframeHomePage) {
      return (
        <iframe
          ref={iframeRef}
          src={homePageSource}
          title='custom-homepage'
          className='w-full h-screen border-none'
        />
      );
    }

    if (isHtmlHomePage) {
      return (
        <div
          className='mt-[60px]'
          data-home-lang={currentLanguage}
          dangerouslySetInnerHTML={{ __html: homePageSource }}
        />
      );
    }

    return (
      <Suspense fallback={<div className='min-h-[55vh]' />}>
        <MarkdownHomeContent
          content={homePageSource}
          currentLanguage={currentLanguage}
        />
      </Suspense>
    );
  };

  return (
    <div className='w-full overflow-x-hidden'>
      {noticeVisible && (
        <Suspense fallback={null}>
          <NoticeModal
            visible={noticeVisible}
            onClose={() => setNoticeVisible(false)}
            isMobile={isMobile}
          />
        </Suspense>
      )}
      <div className='overflow-x-hidden w-full'>{renderHomeContent()}</div>
    </div>
  );
};

export default Home;
