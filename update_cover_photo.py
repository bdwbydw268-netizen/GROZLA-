with open('src/components/Profile.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_logic = """            if (reviewResult.isViolating) {
              await enforceProfilePhotoViolation({
                reason: reviewResult.reason,
                category: reviewResult.violationCategory,
                candidateImg: compressedBase64,
                action: reviewResult.action || 'lock'
              });
              return;
            }"""

new_logic = """            if (reviewResult.isViolating) {
              await updateProfile({
                status: 'suspended',
                suspensionReason: 'PHOTO_REVIEW_10S',
                tempPhotoReview: compressedBase64,
                tempPhotoIsSafe: false,
                tempPhotoReason: reviewResult.reason || 'مخالفة معايير المجتمع للغلاف'
              });
              return;
            }"""

text = text.replace(old_logic, new_logic)

with open('src/components/Profile.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
