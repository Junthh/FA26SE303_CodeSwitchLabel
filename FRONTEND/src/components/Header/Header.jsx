import React, { useState, useRef, useEffect } from 'react';
import { Moon, Bell, ChevronDown, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  SPEAKER_ACCENT as ACCENT,
  SURFACE_HERO,
  TEXT_HEADING, TEXT_BODY,
  TEXT_ON_DARK_PRIMARY,
  BORDER_LIGHT,
} from '../../constants/theme';

export default function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [nameHover, setNameHover] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <header
      className="w-full flex justify-end items-center gap-3 py-3.5 px-6 lg:px-8 shrink-0 z-20"
      style={{ background: '#FFFFFF', borderBottom: `1px solid ${BORDER_LIGHT}` }}
    >
      {/* Nút thông báo */}
      <div className="relative">
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
          style={{ border: `1px solid ${BORDER_LIGHT}`, color: TEXT_BODY }}
        >
          <Bell className="w-4 h-4" />
        </button>
        <span
          className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full ring-2 ring-white"
          style={{ background: ACCENT }}
        />
      </div>

      {/* Thông tin tài khoản */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          onMouseEnter={() => setNameHover(true)}
          onMouseLeave={() => setNameHover(false)}
          className="flex items-center gap-2.5 pl-3 cursor-pointer group"
          style={{ borderLeft: `1px solid ${BORDER_LIGHT}` }}
        >
          <div
            className="w-9 h-9 rounded-lg font-bold flex items-center justify-center text-xs"
            style={{ background: SURFACE_HERO, color: TEXT_ON_DARK_PRIMARY }}
          >
            ML
          </div>
          <div className="text-left leading-tight">
            <p
              className="text-[13px] font-bold transition-colors"
              style={{ color: nameHover ? ACCENT : TEXT_HEADING }}
            >
              Nguyễn Mạnh Lực
            </p>
            <p className="text-[11px] font-semibold" style={{ color: TEXT_BODY }}>Speaker</p>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-all ml-0.5 ${menuOpen ? 'rotate-180' : ''}`}
            style={{ color: TEXT_BODY }}
          />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-30 py-1"
            style={{
              background: '#FFFFFF',
              border: `1px solid ${BORDER_LIGHT}`,
              boxShadow: '0 12px 28px rgba(16,17,20,0.14)',
            }}
          >
            <button
              onClick={() => { setMenuOpen(false); navigate('/profile'); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold hover:bg-[#F7F5EF] transition-colors text-left"
              style={{ color: TEXT_HEADING }}
            >
              <User className="w-4 h-4" style={{ color: TEXT_BODY }} /> Hồ sơ cá nhân
            </button>
            <div className="h-px mx-2 my-1" style={{ background: BORDER_LIGHT }} />
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