import React, { useState, useRef, useEffect } from 'react';
import { Moon, Bell, ChevronDown, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SPEAKER_ACCENT as ACCENT } from '../../constants/theme';

export default function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [nameHover, setNameHover] = useState(false);
  const menuRef = useRef(null);

  // Đóng menu khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // TODO: nối logic đăng xuất thật (xoá token, gọi API...) trước khi điều hướng
  const handleLogout = () => {
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="w-full flex justify-end items-center gap-3 py-3.5 px-6 lg:px-8 bg-white border-b border-[#E5E2D8] shrink-0 z-20">
      {/* Nút đổi giao diện */}
      {/* <button className="w-9 h-9 rounded-lg border border-[#E5E2D8] flex items-center justify-center text-[#6E7078] hover:border-[#2B2C31] hover:text-[#2B2C31] transition-colors cursor-pointer">
        <Moon className="w-4 h-4" />
      </button> */}

      {/* Nút thông báo */}
      <div className="relative">
        <button className="w-9 h-9 rounded-lg border border-[#E5E2D8] flex items-center justify-center text-[#6E7078] hover:border-[#2B2C31] hover:text-[#2B2C31] transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
        </button>
        <span
          className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full ring-2 ring-white"
          style={{ background: ACCENT }}
        ></span>
      </div>

      {/* Thông tin tài khoản Speaker - bấm để mở menu Hồ sơ / Đăng xuất */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          onMouseEnter={() => setNameHover(true)}
          onMouseLeave={() => setNameHover(false)}
          className="flex items-center gap-2.5 pl-3 border-l border-[#E5E2D8] cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-[#16171C] text-white font-bold flex items-center justify-center text-xs">
            ML
          </div>
          <div className="text-left leading-tight">
            <p
              className="text-[13px] font-bold text-[#2B2C31] transition-colors"
              style={nameHover ? { color: ACCENT } : {}}
            >
              Nguyễn Mạnh Lực
            </p>
            <p className="text-[11px] text-[#6E7078] font-semibold">Speaker</p>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-[#6E7078] group-hover:text-[#2B2C31] transition-all ml-0.5 ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-[#E5E2D8] shadow-[0_12px_28px_rgba(16,17,20,0.14)] overflow-hidden z-30 py-1">
            <button
              onClick={() => { setMenuOpen(false); navigate('/profile'); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold text-[#2B2C31] hover:bg-[#F7F5EF] transition-colors text-left"
            >
              <User className="w-4 h-4 text-[#6E7078]" /> Hồ sơ cá nhân
            </button>
            <div className="h-px bg-[#E5E2D8] mx-2 my-1" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold hover:bg-[#FDEAEA] transition-colors text-left"
              style={{ color: ACCENT }}
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}