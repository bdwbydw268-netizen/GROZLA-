import React, { useState } from 'react';
import { X, Save, Edit3, Image as ImageIcon } from 'lucide-react';
import { Group, User } from '../types';

interface Props {
  group: Group;
  users: User[];
  currentUid: string;
  onClose: () => void;
  updateGroupSettings: (groupId: string, updates: Partial<Group>) => Promise<void>;
}

export default function GroupSettingsModal({ group, users, currentUid, onClose, updateGroupSettings }: Props) {
  const [name, setName] = useState(group.name || '');
  const [avatar, setAvatar] = useState(group.avatar || '');
  const [loading, setLoading] = useState(false);

  // Nicknames state
  const [nicknames, setNicknames] = useState<Record<string, string>>(group.nicknames || {});

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateGroupSettings(group.id, { name, avatar, nicknames });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNicknameChange = (userId: string, newNickname: string) => {
    setNicknames(prev => ({ ...prev, [userId]: newNickname }));
  };

  const isAdmin = group.admins?.includes(currentUid) || false;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <h2 className="text-lg font-black text-gray-900">إعدادات المجموعة</h2>
          <button onClick={onClose} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6 dir-rtl">
          {isAdmin ? (
            <form id="group-form" onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-700">اسم المجموعة</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 text-sm font-bold outline-none transition-all"
                    required
                  />
                  <Edit3 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-700">رابط صورة المجموعة</label>
                <div className="relative">
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 text-sm font-bold outline-none transition-all text-left"
                    dir="ltr"
                    placeholder="https://..."
                  />
                  <ImageIcon size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </form>
          ) : (
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100 text-center">
              فقط المشرفين يمكنهم تعديل اسم وصورة المجموعة
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-black text-gray-900">أعضاء المجموعة والألقاب</h3>
            <div className="space-y-2">
              {group.members.map((memberId, mIdx) => {
                const user = users.find(u => u.id === memberId);
                if (!user) return null;
                const isUserAdmin = group.admins?.includes(memberId);
                return (
                  <div key={`group-member-${memberId}-${mIdx}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 truncate">{user.name}</span>
                        {isUserAdmin && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black">مشرف</span>}
                      </div>
                      {isAdmin && (
                        <input
                          type="text"
                          value={nicknames[memberId] || ''}
                          onChange={(e) => handleNicknameChange(memberId, e.target.value)}
                          placeholder="تعيين لقب (كنية)..."
                          className="w-full mt-1.5 py-1.5 px-3 bg-white rounded-lg border border-gray-200 text-xs font-medium outline-none focus:border-blue-500 transition-all"
                        />
                      )}
                      {!isAdmin && nicknames[memberId] && (
                        <div className="text-xs text-blue-600 font-bold mt-1">اللقب: {nicknames[memberId]}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="p-4 border-t bg-gray-50">
            <button
              form="group-form"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1877f2] hover:bg-blue-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  <span>حفظ التغييرات</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
