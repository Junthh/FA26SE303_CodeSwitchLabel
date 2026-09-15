import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import Sidebar from '../../components/Sidebar/Sidebar';
import Logo from '../../components/Logo/Logo';
import Header from '../../components/Header/Header';
import usePageTitle from '../../hooks/usePageTitle';

export default function HomeTemplate() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  usePageTitle();

  return (
    <div className="h-screen w-screen overflow-hidden relative">
        {/* Top Header cho Mobile/Tablet (< 1024px) */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#E5E2D8] px-4 flex items-center justify-between z-30">
          <Logo />
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2.5 rounded-lg border border-[#E5E2D8] text-[#2B2C31] hover:border-[#2B2C31] transition-colors"
            aria-label="Toggle Menu"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Overlay mờ khi mở Sidebar trên Mobile */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-[#16171C]/50 backdrop-blur-sm z-30 transition-opacity"
          />
        )}

        {/* Layout chính */}
        <div className="flex h-full w-full overflow-hidden">
          {/* Sidebar dùng chung - truyền role="speaker" để lấy đúng config */}
          <Sidebar role="speaker" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          {/* Main container: Header cố định ở trên và phần Outlet cuộn ở dưới */}
          <main className="flex-1 lg:ml-64 h-full flex flex-col overflow-hidden bg-[#F7F5EF] pt-16 lg:pt-0">
            {/* Header cố định nằm trên cùng */}
            <div className="hidden lg:block">
              <Header />
            </div>

            {/* Phần nội dung các trang con (Outlet) tự động cuộn độc lập */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>


        <Toaster
          position="top-right"
          offset={{ top: '70px', right: '6px' }}
          style={{ '--width': '280px' }}
        />
    </div>
  );
}