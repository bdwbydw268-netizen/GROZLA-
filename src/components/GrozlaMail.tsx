import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Send, 
  Trash2, 
  RefreshCw, 
  Search, 
  Plus, 
  X, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Inbox, 
  Send as SendIcon, 
  FileText, 
  Trash, 
  ChevronRight, 
  ChevronDown,
  ArrowLeft, 
  ArrowRight,
  User, 
  Calendar, 
  LogOut, 
  Eye, 
  FileUp, 
  Check, 
  MailOpen, 
  ShieldCheck, 
  Lock, 
  HelpCircle,
  Clock,
  Sparkle
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function GrozlaMail() {
  const { showToast, gmailToken, setGmailToken, signInWithGoogleForGmail, currentUser, direction } = useAppContext();

  // App Mail State
  const [mails, setMails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFolder, setActiveFolder] = useState<'INBOX' | 'SENT' | 'DRAFT' | 'TRASH'>('INBOX');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMail, setSelectedMail] = useState<any | null>(null);

  // Compose State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  // Mandatory Confirmations Modal State (MANDATORY by Workspace Integration Skill)
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [mailToDelete, setMailDelete] = useState<any | null>(null);

  useEffect(() => {
    if (gmailToken) {
      fetchEmails();
    }
  }, [gmailToken, activeFolder]);

  // Handle Gmail Authentication
  const handleGmailLogin = async () => {
    try {
      await signInWithGoogleForGmail();
      showToast('🎉 تم ربط بريد Gmail بنجاح!');
    } catch (err) {
      console.error(err);
      showToast('❌ تعذر ربط بريد Gmail، يرجى المحاولة لاحقاً.');
    }
  };

  const handleGmailLogout = () => {
    setGmailToken(null);
    setMails([]);
    setSelectedMail(null);
    showToast('تم إلغاء ربط بريد Gmail بنجاح.');
  };

  // Fetch emails list from Gmail API
  const fetchEmails = async () => {
    if (!gmailToken) return;
    setLoading(true);
    try {
      let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=label:${activeFolder}`;
      if (searchQuery.trim()) {
        url += ` ${encodeURIComponent(searchQuery.trim())}`;
      }

      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${gmailToken}` }
      });

      if (!resp.ok) {
        if (resp.status === 401) {
          handleGmailLogout();
          return;
        }
        throw new Error('Gmail API error');
      }

      const listData = await resp.json();
      const messages = listData.messages || [];

      // Fetch details for each message
      const detailsPromises = messages.map(async (msg: any) => {
        const detailResp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${gmailToken}` }
        });
        if (detailResp.ok) {
          return await detailResp.json();
        }
        return null;
      });

      const detailedMails = (await Promise.all(detailsPromises)).filter(Boolean);
      
      // Parse emails beautifully
      const parsedMails = detailedMails.map((mail: any) => {
        const headers = mail.payload.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(بدون عنوان)';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'مجهول';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
        const snippet = mail.snippet || '';
        const unread = mail.labelIds?.includes('UNREAD');

        // Extract body
        let body = '';
        if (mail.payload.body?.data) {
          body = decodeBase64Url(mail.payload.body.data);
        } else if (mail.payload.parts) {
          const textPart = mail.payload.parts.find((p: any) => p.mimeType === 'text/plain') || mail.payload.parts[0];
          if (textPart && textPart.body?.data) {
            body = decodeBase64Url(textPart.body.data);
          }
        }

        return {
          id: mail.id,
          threadId: mail.threadId,
          subject,
          from,
          date,
          snippet,
          body: body || snippet,
          unread,
          labelIds: mail.labelIds || []
        };
      });

      setMails(parsedMails);
    } catch (err) {
      console.error(err);
      showToast('❌ خطأ في الاتصال بخدمة Gmail.');
    } finally {
      setLoading(false);
    }
  };

  // Base64Url safe decoding
  const decodeBase64Url = (base64UrlStr: string) => {
    try {
      let base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      return decodeURIComponent(escape(atob(base64)));
    } catch (e) {
      try {
        let base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
        return atob(base64);
      } catch {
        return '';
      }
    }
  };

  // Safe base64url encoding for sending
  const encodeBase64UrlStr = (str: string) => {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  // Initiate Compose confirmation modal
  const handleComposeSendClick = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!composeTo.trim() || !emailRegex.test(composeTo.trim())) {
      showToast('يرجى كتابة بريد إلكتروني صحيح للمستلم.');
      return;
    }
    if (!composeSubject.trim()) {
      showToast('يرجى تحديد موضوع الرسالة.');
      return;
    }
    if (!composeBody.trim()) {
      showToast('يرجى كتابة محتوى الرسالة.');
      return;
    }

    setConfirmSendOpen(true);
  };

  // Send real email via Gmail API (MANDATORY user confirmed in modal)
  const executeSendEmail = async () => {
    if (!gmailToken) return;
    setConfirmSendOpen(false);
    setLoading(true);
    try {
      // Build MIME message natively
      const emailLines = [
        `To: ${composeTo.trim()}`,
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(composeSubject.trim())))}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        composeBody.replace(/\n/g, '<br />')
      ];

      const rawMime = emailLines.join('\r\n');
      const rawBase64Url = encodeBase64UrlStr(rawMime);

      const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gmailToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: rawBase64Url })
      });

      if (resp.ok) {
        showToast('🎉 تم إرسال البريد الإلكتروني بنجاح!');
        setIsComposeOpen(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        fetchEmails();
      } else {
        throw new Error('Send failed');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ تعذر إرسال البريد الإلكتروني.');
    } finally {
      setLoading(false);
    }
  };

  // Initiate Delete confirmation modal (MANDATORY per skill guidelines)
  const handleDeleteClick = (mail: any) => {
    setMailDelete(mail);
    setConfirmDeleteOpen(true);
  };

  // Delete real email via Gmail API (MANDATORY user confirmed in modal)
  const executeDeleteEmail = async () => {
    if (!gmailToken || !mailToDelete) return;
    setConfirmDeleteOpen(false);
    setLoading(true);
    try {
      // Trash message instead of permanent deletion for better safety
      const resp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${mailToDelete.id}/trash`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${gmailToken}` }
      });

      if (resp.ok) {
        showToast('🗑️ تم نقل الرسالة إلى سلة المهملات.');
        setSelectedMail(null);
        fetchEmails();
      } else {
        throw new Error('Trash failed');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ تعذر حذف البريد الإلكتروني.');
    } finally {
      setLoading(false);
      setMailDelete(null);
    }
  };

  // AI-Powered Smart Compose Draft Assistant (Gemini integration!)
  const handleGenerateAiCompose = async () => {
    if (!aiPrompt.trim()) {
      showToast('يرجى كتابة ما تريد صياغته بالذكاء الاصطناعي.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const response = await fetch('/api/mail/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          replyContext: selectedMail ? selectedMail.body : undefined,
          originalSender: selectedMail ? selectedMail.from : undefined,
          originalSubject: selectedMail ? selectedMail.subject : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComposeSubject(data.subject || '');
        setComposeBody(data.body || '');
        setAiPrompt('');
        setShowAiAssistant(false);
        showToast('✨ تم صياغة البريد وتجهيزه بالذكاء الاصطناعي!');
      } else {
        throw new Error('AI generation failed');
      }
    } catch (err) {
      console.error(err);
      showToast('تعذر جلب الصياغة الذكية حالياً.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Mark email as read / unread
  const toggleUnreadStatus = async (mail: any) => {
    if (!gmailToken) return;
    const addLabelIds = mail.unread ? [] : ['UNREAD'];
    const removeLabelIds = mail.unread ? ['UNREAD'] : [];

    try {
      const resp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${mail.id}/modify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gmailToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ addLabelIds, removeLabelIds })
      });

      if (resp.ok) {
        showToast(mail.unread ? 'تم تعيين الرسالة كمقروءة' : 'تم تعيين كغير مقروءة');
        setMails(prev => prev.map(m => m.id === mail.id ? { ...m, unread: !m.unread } : m));
        if (selectedMail && selectedMail.id === mail.id) {
          setSelectedMail(prev => ({ ...prev, unread: !prev.unread }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-4 sm:p-6 dir-rtl text-right min-h-[80vh] flex flex-col justify-start">
      
      {/* GMAIL LOGIN SENSITIVE SCREEN GUARD */}
      {!gmailToken ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-12">
          <div className="w-20 h-20 rounded-3xl bg-red-50 text-red-500 border border-red-200 flex items-center justify-center shadow-md">
            <Mail size={40} className="animate-pulse" />
          </div>

          <div className="space-y-2 max-w-sm">
            <h2 className="font-black text-gray-900 text-lg sm:text-xl">
              تكامل بريد Gmail الذكي — GROZLA Mail
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              قم بربط حساب جوجل الخاص بك لقراءة، تصفح، إرسال وإدارة رسائل بريدك الإلكتروني Gmail مباشرة وبأقصى درجات الأمان والتحكم.
            </p>
          </div>

          {/* Secure Permission Alert Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 w-full max-w-sm space-y-2 text-xs">
            <p className="font-bold text-slate-800 flex items-center gap-1.5 justify-center">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>مستويات الأمان والحماية المتقدمة</span>
            </p>
            <p className="text-slate-500 leading-normal text-[11px]">
              يتم ربط حسابك بتفويض رسمي وإذن مباشر منك من خلال خوادم جوجل الآمنة. لا يتم حفظ كلمات المرور أو مشاركة بياناتك مع أي طرف ثالث على الإطلاق.
            </p>
          </div>

          {/* Sign in with Google Button formatted exactly like Google Identity guidelines */}
          <button
            type="button"
            onClick={handleGmailLogin}
            className="flex items-center gap-3 px-6 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-extrabold text-xs sm:text-sm shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span>ربط وتفعيل حساب Gmail ⚡</span>
          </button>
        </div>
      ) : (
        
        // REAL GMAIL MAILBOX INTERFACE
        <div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden">
          
          {/* MAIL SIDEBAR PANEL */}
          <aside className="w-full lg:w-56 shrink-0 flex flex-col gap-2">
            {/* Compose Mail Button */}
            <button
              type="button"
              onClick={() => {
                setComposeTo('');
                setComposeSubject('');
                setComposeBody('');
                setIsComposeOpen(true);
              }}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Plus size={18} />
              <span>إنشاء رسالة جديدة</span>
            </button>

            {/* Folders List */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 space-y-1 mt-2">
              {[
                { id: 'INBOX', name: 'صندوق الوارد', icon: Inbox, color: 'text-blue-500' },
                { id: 'SENT', name: 'الرسائل المرسلة', icon: SendIcon, color: 'text-emerald-500' },
                { id: 'DRAFT', name: 'المسودات', icon: FileText, color: 'text-amber-500' },
                { id: 'TRASH', name: 'المهملات', icon: Trash, color: 'text-rose-500' }
              ].map((folder) => {
                const FolderIcon = folder.icon;
                const isSelected = activeFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => {
                      setActiveFolder(folder.id as any);
                      setSelectedMail(null);
                    }}
                    className={`w-full p-2.5 rounded-xl text-right flex items-center justify-between transition-colors text-xs font-bold cursor-pointer ${
                      isSelected 
                        ? 'bg-red-50 border-r-4 border-red-500 text-red-600' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FolderIcon size={16} className={folder.color} />
                      <span>{folder.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Connected User details */}
            <div className="mt-auto bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">تفويض Gmail نشط</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{currentUser?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleGmailLogout}
                className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
                title="إلغاء ربط الحساب"
              >
                <LogOut size={14} />
              </button>
            </div>
          </aside>

          {/* REALTIME LIST / EMAIL CONTAINER WORKSPACE */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-slate-50 border border-slate-200 rounded-2xl">
            
            {/* Top Search & Refresh Actions */}
            <div className="p-3 border-b border-slate-200 bg-white flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1">
                <Search size={15} className="absolute right-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchEmails()}
                  placeholder="بحث في الرسائل والبريد..."
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-red-400 font-medium"
                />
              </div>

              <button
                type="button"
                onClick={fetchEmails}
                disabled={loading}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer shrink-0"
                title="تحديث صندوق البريد"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* SPLIT VIEW (selected mail details vs email list) */}
            <div className="flex-1 flex overflow-hidden relative">
              
              {/* EMAIL LIST STREAM */}
              <div className={`w-full ${selectedMail ? 'hidden md:block md:w-1/2' : 'w-full'} overflow-y-auto divide-y divide-slate-100 bg-white`}>
                {loading && mails.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 space-y-2">
                    <RefreshCw size={24} className="animate-spin mx-auto text-red-500" />
                    <p className="text-xs font-bold">جاري تحميل رسائل البريد...</p>
                  </div>
                ) : mails.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <MailOpen size={30} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold">لا يوجد رسائل بريد هنا.</p>
                  </div>
                ) : (
                  mails.map((mail, idx) => (
                    <div
                      key={`mail-${mail.id}-${idx}`}
                      onClick={() => setSelectedMail(mail)}
                      className={`p-3.5 text-right transition-colors cursor-pointer relative hover:bg-slate-50/80 ${
                        selectedMail?.id === mail.id ? 'bg-red-50/40 ring-1 ring-red-100' : ''
                      }`}
                    >
                      {/* Unread Indicator dot */}
                      {mail.unread && (
                        <div className="absolute right-2 top-4 w-2 h-2 rounded-full bg-blue-600 shadow-xs" />
                      )}

                      <div className="pr-2 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className={`truncate font-bold ${mail.unread ? 'text-gray-900 font-black' : 'text-slate-600'}`}>
                            {mail.from.split('<')[0] || mail.from}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{mail.date.split(',')[1]?.trim() || mail.date.substring(0, 16)}</span>
                        </div>

                        <h4 className={`text-xs truncate ${mail.unread ? 'text-gray-900 font-extrabold' : 'text-slate-800'}`}>
                          {mail.subject}
                        </h4>

                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {mail.snippet}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* EXPANDED EMAIL DETAILS PANEL */}
              {selectedMail && (
                <div className="w-full md:w-1/2 overflow-y-auto bg-slate-50 p-4 space-y-4 flex flex-col justify-start absolute inset-0 md:relative md:border-r border-slate-200/80">
                  
                  {/* Back button on mobile */}
                  <button
                    type="button"
                    onClick={() => setSelectedMail(null)}
                    className="md:hidden p-2 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1 self-start text-xs font-bold"
                  >
                    <ArrowRight size={15} />
                    <span>الرجوع للمذكرة</span>
                  </button>

                  {/* Header Card */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      {selectedMail.subject}
                    </h3>

                    <div className="flex items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shadow-2xs border border-slate-200">
                          {selectedMail.from.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{selectedMail.from.split('<')[0]}</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{selectedMail.from.match(/<([^>]+)>/)?.[1] || selectedMail.from}</p>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{selectedMail.date}</span>
                    </div>
                  </div>

                  {/* Content Body of Email */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex-1 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed overflow-x-auto min-h-[150px]">
                    {selectedMail.body}
                  </div>

                  {/* Gmail Interactive Actions Cockpit */}
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleUnreadStatus(selectedMail)}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold cursor-pointer"
                      >
                        {selectedMail.unread ? 'مقروءة' : 'غير مقروءة'}
                      </button>

                      {/* Reply with AI Assist Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setComposeTo(selectedMail.from.match(/<([^>]+)>/)?.[1] || selectedMail.from);
                          setComposeSubject(`رد: ${selectedMail.subject}`);
                          setComposeBody('');
                          setIsComposeOpen(true);
                          setShowAiAssistant(true);
                        }}
                        className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-[#8b5cf6] border border-purple-200 rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles size={13} className="text-yellow-500" />
                        <span>رد ذكي (AI)</span>
                      </button>
                    </div>

                    {/* Trash email with MANDATORY confirmation per skill guidelines */}
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(selectedMail)}
                      className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                      title="حذف الرسالة ونقلها للمهملات"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* COMPOSE MAIL MODAL */}
      <AnimatePresence>
        {isComposeOpen && (
          <div className="fixed inset-0 bg-black/60 z-[300] backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 dir-rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between">
                <span className="font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                  <Mail size={18} />
                  <span>{composeSubject ? 'رد على رسالة' : 'إنشاء رسالة بريد جديدة'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="text-white/80 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Compose Body Form */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                
                {/* AI Assistant Quick Tool Header */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowAiAssistant(!showAiAssistant)}
                    className="w-full flex items-center justify-between text-xs font-bold text-purple-700 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={15} className="text-yellow-500 animate-pulse" />
                      <span>صياغة بمساعد الذكاء الاصطناعي (AI Assistant)</span>
                    </span>
                    <ChevronDown size={14} className={`transform transition-transform ${showAiAssistant ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showAiAssistant && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 pt-2 border-t border-purple-200/60 overflow-hidden"
                      >
                        <textarea
                          rows={2}
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="اكتب توجيهك (مثال: رد بالقبول وتحديد يوم الاثنين للمقابلة، أو اكتب تهنئة بمناسبة العام الجديد)..."
                          className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 placeholder:text-slate-400 font-medium"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateAiCompose}
                          disabled={isGeneratingAi}
                          className="bg-[#8b5cf6] hover:bg-purple-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm flex items-center gap-1 cursor-pointer transition-colors active:scale-95 disabled:opacity-50"
                        >
                          {isGeneratingAi ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              <span>جاري الصياغة...</span>
                            </>
                          ) : (
                            <>
                              <Sparkle size={13} />
                              <span>صياغة المسودة السحرية ✨</span>
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Receiver To field */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">إلى (To):</label>
                  <input
                    type="email"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-400 font-mono font-bold"
                  />
                </div>

                {/* Subject field */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">الموضوع (Subject):</label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="حدد موضوع البريد..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-400 font-bold"
                  />
                </div>

                {/* Body Content field */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">محتوى البريد (Message):</label>
                  <textarea
                    rows={6}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-400 resize-none font-medium leading-relaxed"
                  />
                </div>

              </div>

              {/* Modal Actions */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={handleComposeSendClick}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>إرسال البريد</span>
                  <Send size={15} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANDATORY CONFIRMATION: EMAIL SEND (MANDATORY per skill guidelines) */}
      <AnimatePresence>
        {confirmSendOpen && (
          <div className="fixed inset-0 bg-black/75 z-[400] flex items-center justify-center p-4 dir-rtl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-5 border border-slate-200 shadow-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 border border-red-100 mx-auto shadow-sm">
                <Send size={28} className="animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-extrabold text-gray-900 text-base">تأكيد إرسال البريد الإلكتروني؟</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  هل أنت متأكد من رغبتك في إرسال هذه الرسالة بالنيابة عنك إلى المستلم المحدد؟
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-right space-y-1 text-xs">
                <p><span className="text-slate-500">المستلم:</span> <strong className="font-mono text-slate-800 font-bold">{composeTo}</strong></p>
                <p className="truncate"><span className="text-slate-500">الموضوع:</span> <strong className="text-slate-800">{composeSubject}</strong></p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmSendOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  إلغاء وتعديل
                </button>
                <button
                  type="button"
                  onClick={executeSendEmail}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-extrabold text-xs cursor-pointer active:scale-95 shadow-md"
                >
                  نعم، إرسال الآن ⚡
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANDATORY CONFIRMATION: EMAIL DELETION (MANDATORY per skill guidelines) */}
      <AnimatePresence>
        {confirmDeleteOpen && (
          <div className="fixed inset-0 bg-black/75 z-[400] flex items-center justify-center p-4 dir-rtl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-5 border border-slate-200 shadow-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100 mx-auto shadow-sm">
                <Trash2 size={26} className="animate-bounce" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-extrabold text-gray-900 text-base">حذف البريد ونقله للمهملات؟</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  هل أنت متأكد من رغبتك في نقل هذه الرسالة الإلكترونية إلى سلة المهملات ببريد Gmail؟
                </p>
              </div>

              {mailToDelete && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-right text-xs truncate">
                  <span className="text-slate-500">الرسالة:</span> <strong className="text-slate-800 font-bold">{mailToDelete.subject}</strong>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDeleteOpen(false);
                    setMailDelete(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  إلغاء الإجراء
                </button>
                <button
                  type="button"
                  onClick={executeDeleteEmail}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs cursor-pointer active:scale-95 shadow-md"
                >
                  نعم، نقل للمهملات 🗑️
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
