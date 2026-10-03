with open('src/components/SuspendedAccount.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add a useEffect to handle the 10s countdown if suspensionReason === 'PHOTO_REVIEW_10S'
# We also need a state for the 10s countdown
state_code = """
  // Photo Review 10s state
  const [photoReviewCountdown, setPhotoReviewCountdown] = useState(10);
"""
text = text.replace("  // 5-Second Selfie Review & Reactivation State", state_code + "  // 5-Second Selfie Review & Reactivation State")

effect_code = """
  useEffect(() => {
    if (currentUser?.suspensionReason === 'PHOTO_REVIEW_10S') {
      let count = 10;
      setPhotoReviewCountdown(count);
      const interval = setInterval(async () => {
        count--;
        setPhotoReviewCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          
          if (currentUser.tempPhotoIsSafe) {
            // Restore account and apply avatar
            await updateProfile({
              status: 'active',
              suspensionReason: null,
              avatar: currentUser.tempPhotoReview,
              tempPhotoReview: null,
              tempPhotoIsSafe: null,
              tempPhotoReason: null
            });
            setCurrentView('home');
          } else {
            // Disable account
            await updateProfile({
              status: 'disabled',
              suspensionReason: 'لقد قمنا بتعطيل حسابك لانتهاك معايير المجتمع بشأن النشاط الجنسي أو العري أو السلوك غير اللائق.',
              avatar: 'https://i.pravatar.cc/150?u=safe_default',
              tempPhotoReview: null,
              tempPhotoIsSafe: null,
              tempPhotoReason: null
            });
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.suspensionReason, currentUser?.id]);
"""
text = text.replace("  if (!currentUser) return null;", effect_code + "\n  if (!currentUser) return null;")

with open('src/components/SuspendedAccount.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
