import re

with open('src/components/Profile.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the avatar upload logic
old_logic = """            if (reviewResult.isViolating) {
              setViolationCandidateImg(compressedBase64);
              setViolationResultDetails(reviewResult);
              setShowViolationModal(true);

              // 1. Delete image first and lock account immediately as per Facebook standards
              await enforceProfilePhotoViolation({
                reason: reviewResult.reason,
                category: reviewResult.violationCategory,
                candidateImg: compressedBase64,
                action: reviewResult.action || 'lock'
              });
              return;
            }
          } catch (err) {
            console.error("Photo safety evaluation error:", err);
            setIsEvaluatingAvatar(false);
          }

          // Safe photo: Update the avatar normally, publish feed post, and do NOT lock account
          await updateProfile({ avatar: compressedBase64 });
          await addPost('قمت بتحديث صورة ملفي الشخصي', compressedBase64);
          showToast('✅ تم تحديث صورتك الشخصية بنجاح!');
          return;"""

new_logic = """            if (reviewResult.isViolating) {
              await updateProfile({
                status: 'suspended',
                suspensionReason: 'PHOTO_REVIEW_10S',
                tempPhotoReview: compressedBase64,
                tempPhotoIsSafe: false,
                tempPhotoReason: reviewResult.reason || 'مخالفة معايير المجتمع'
              });
              return;
            } else {
              await updateProfile({
                status: 'suspended',
                suspensionReason: 'PHOTO_REVIEW_10S',
                tempPhotoReview: compressedBase64,
                tempPhotoIsSafe: true,
                tempPhotoReason: 'مطابق لمعايير المجتمع'
              });
              return;
            }
          } catch (err) {
            console.error("Photo safety evaluation error:", err);
            setIsEvaluatingAvatar(false);
          }"""

text = text.replace(old_logic, new_logic)

with open('src/components/Profile.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
