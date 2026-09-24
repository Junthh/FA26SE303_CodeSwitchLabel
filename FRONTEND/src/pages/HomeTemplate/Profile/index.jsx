import { Save } from 'lucide-react';
import { SPEAKER_ACCENT as ACCENT } from '../../../constants/theme';
import { SPEAKER_PROFILE } from '../../../mocks/speaker/profile';

export default function Profile() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 text-left font-sans">
      <div>
        <h1 className="text-[22px] font-bold text-[#2B2C31] tracking-tight">Thông tin cá nhân</h1>
        <p className="text-[13px] text-[#6E7078] mt-1">Cập nhật thông tin cá nhân của bạn để hỗ trợ thu thập dữ liệu chính xác hơn.</p>
      </div>

      <div className="bg-white p-6 rounded-[24px] border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] space-y-5">
        <h3 className="text-[15px] font-bold text-[#2B2C31] border-b border-[#E5E2D8] pb-3">Chi tiết hồ sơ</h3>

        <form className="space-y-3.5">
          <div>
            <label className="block text-[12.5px] font-bold text-[#2B2C31] mb-1.5">Họ và tên *</label>
            <input
              type="text"
              defaultValue={SPEAKER_PROFILE.fullName}
              className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-[#E5E2D8] bg-white text-[#2B2C31] text-[13px] font-medium hover:border-[#D8D5C9] focus:border-[#3563C9] focus:ring-4 focus:ring-[#3563C9]/10 transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] font-bold text-[#2B2C31] mb-1.5">Giới tính *</label>
              <select defaultValue={SPEAKER_PROFILE.gender} className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-[#E5E2D8] bg-white text-[#2B2C31] text-[13px] font-medium hover:border-[#D8D5C9] focus:border-[#3563C9] focus:ring-4 focus:ring-[#3563C9]/10 transition-all outline-none">
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-[#2B2C31] mb-1.5">Ngày sinh *</label>
              <input
                type="date"
                defaultValue={SPEAKER_PROFILE.birthDate}
                className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-[#E5E2D8] bg-white text-[#2B2C31] text-[13px] font-medium hover:border-[#D8D5C9] focus:border-[#3563C9] focus:ring-4 focus:ring-[#3563C9]/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Bỏ Vùng miền - thay bằng Trình độ tiếng Anh (IELTS), đi cùng hàng với Tỉnh/Thành phố */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] font-bold text-[#2B2C31] mb-1.5">Tỉnh / Thành phố *</label>
              <input
                type="text"
                defaultValue={SPEAKER_PROFILE.hometown}
                placeholder="Ví dụ: Hà Nội"
                className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-[#E5E2D8] bg-white text-[#2B2C31] text-[13px] font-medium hover:border-[#D8D5C9] focus:border-[#3563C9] focus:ring-4 focus:ring-[#3563C9]/10 transition-all outline-none placeholder:text-[#B7B4A9] placeholder:font-normal"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-[#2B2C31] mb-1.5">Trình độ tiếng Anh (IELTS)</label>
              <select defaultValue={SPEAKER_PROFILE.englishLevel} className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-[#E5E2D8] bg-white text-[#2B2C31] text-[13px] font-medium hover:border-[#D8D5C9] focus:border-[#3563C9] focus:ring-4 focus:ring-[#3563C9]/10 transition-all outline-none">
                <option value="Chưa có">Chưa có</option>
                <option value="Dưới 4.0">Dưới 4.0</option>
                <option value="4.0 - 5.0">4.0 - 5.0</option>
                <option value="5.5 - 6.5">5.5 - 6.5</option>
                <option value="7.0 - 8.0">7.0 - 8.0</option>
                <option value="8.5+">8.5+</option>
              </select>
            </div>
          </div>

          {/* Nghề nghiệp + Chuyên ngành cùng hàng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] font-bold text-[#2B2C31] mb-1.5">Nghề nghiệp *</label>
              <input
                type="text"
                defaultValue={SPEAKER_PROFILE.occupation}
                placeholder="Ví dụ: Sinh viên, nhân viên văn phòng, giáo viên..."
                className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-[#E5E2D8] bg-white text-[#2B2C31] text-[13px] font-medium hover:border-[#D8D5C9] focus:border-[#3563C9] focus:ring-4 focus:ring-[#3563C9]/10 transition-all outline-none placeholder:text-[#B7B4A9] placeholder:font-normal"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-[#2B2C31] mb-1.5">Chuyên ngành</label>
              <input
                type="text"
                placeholder="Ví dụ: Công nghệ thông tin, Ngôn ngữ Anh..."
                className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-[#E5E2D8] bg-white text-[#2B2C31] text-[13px] font-medium hover:border-[#D8D5C9] focus:border-[#3563C9] focus:ring-4 focus:ring-[#3563C9]/10 transition-all outline-none placeholder:text-[#B7B4A9] placeholder:font-normal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] font-bold text-[#2B2C31] mb-1.5">Email</label>
              <input
                type="email"
                defaultValue={SPEAKER_PROFILE.email}
                className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-[#E5E2D8] bg-white text-[#2B2C31] text-[13px] font-medium hover:border-[#D8D5C9] focus:border-[#3563C9] focus:ring-4 focus:ring-[#3563C9]/10 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-[#2B2C31] mb-1.5">Mật khẩu</label>
              <input
                type="password"
                defaultValue="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-[#E5E2D8] bg-white text-[#2B2C31] text-[13px] font-medium hover:border-[#D8D5C9] focus:border-[#3563C9] focus:ring-4 focus:ring-[#3563C9]/10 transition-all outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-[13px] hover:opacity-90 active:scale-[0.99] transition-all"
              style={{ background: ACCENT, boxShadow: `0 10px 24px ${ACCENT}40` }}
            >
              <Save className="w-4 h-4" /> Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}