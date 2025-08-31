@echo off
echo Committing Profile Polish Pack changes...

git add src/components/profile/AboutCard.tsx
git add src/components/profile/GalleryToggle.tsx
git add src/components/profile/StatsBadges.tsx
git add src/app/profile/ProfileTabs.tsx
git add src/components/profile/ProfileHeaderLayout.tsx

git commit -m "feat(profile): hide empty rows in AboutCard with inline CTAs for owner

- Hide empty bio/location/website fields for non-owners
- Show inline CTAs for profile owners to add missing info
- Improve GalleryToggle selected state and persist mode in localStorage
- Enhance StatsBadges with proper button roles and a11y labels
- Add subtle shadow and ring effects to profile header
- Improve button hover states with ring effects"

echo Done! Profile Polish Pack committed successfully.
pause
