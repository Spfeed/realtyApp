import { useEffect, useState } from "react";
import {
  deleteAvatar,
  updateMyProfile,
  uploadAvatar,
  type UserProfile,
} from "../../api/userApi";
import { ProtectedAvatar } from "../../components/ProtecredAvatar";

type Props = {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
};

export function ProfileSettingsSection({ profile, onProfileUpdate }: Props) {
  const [profileForm, setProfileForm] = useState({
    surname: "",
    name: "",
    patronymic: "",
    phone: "",
  });

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    setProfileForm({
      surname: profile.surname ?? "",
      name: profile.name ?? "",
      patronymic: profile.patronymic ?? "",
      phone: profile.phone ?? "",
    });
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    try {
      setProfileSaving(true);
      setProfileMessage("");

      const updated = await updateMyProfile({
        surname: profileForm.surname.trim(),
        name: profileForm.name.trim(),
        patronymic: profileForm.patronymic.trim() || undefined,
        phone: profileForm.phone.trim(),
      });

      onProfileUpdate(updated);
      setProfileMessage("Профиль обновлён");
    } catch (e) {
      setProfileMessage(
        e instanceof Error ? e.message : "Ошибка обновления профиля",
      );
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleAvatarUpload(file?: File) {
    if (!file) return;

    try {
      setProfileSaving(true);

      const updated = await uploadAvatar(file);
      onProfileUpdate(updated);
      setProfileMessage("Аватар обновлён");
    } catch (e) {
      setProfileMessage(
        e instanceof Error ? e.message : "Ошибка загрузки аватара",
      );
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleAvatarDelete() {
    try {
      setProfileSaving(true);

      const updated = await deleteAvatar();
      onProfileUpdate(updated);
      setProfileMessage("Аватар удалён");
    } catch (e) {
      setProfileMessage(
        e instanceof Error ? e.message : "Ошибка удаления аватара",
      );
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <section className="profile-settings-card">
      <h2>Настройки профиля</h2>
      <p>Измените личные данные и аватар.</p>

      <div className="profile-avatar-editor">
        <ProtectedAvatar
          avatarUrl={profile.avatarUrl}
          fallback={profile.name?.[0] ?? "П"}
          className="profile-settings-avatar"
          imgClassName="profile-settings-avatar-img"
        />

        <div>
          <label className="profile-avatar-upload">
            Загрузить аватар
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
            />
          </label>

          {profile.avatarUrl && (
            <button
              type="button"
              className="profile-avatar-delete"
              onClick={handleAvatarDelete}
              disabled={profileSaving}
            >
              Удалить аватар
            </button>
          )}
        </div>
      </div>

      <form className="profile-settings-form" onSubmit={handleSaveProfile}>
        <label>
          <span>Фамилия</span>
          <input
            value={profileForm.surname}
            onChange={(e) =>
              setProfileForm({ ...profileForm, surname: e.target.value })
            }
          />
        </label>

        <label>
          <span>Имя</span>
          <input
            value={profileForm.name}
            onChange={(e) =>
              setProfileForm({ ...profileForm, name: e.target.value })
            }
          />
        </label>

        <label>
          <span>Отчество</span>
          <input
            value={profileForm.patronymic}
            onChange={(e) =>
              setProfileForm({ ...profileForm, patronymic: e.target.value })
            }
          />
        </label>

        <label>
          <span>Телефон</span>
          <input
            value={profileForm.phone}
            onChange={(e) =>
              setProfileForm({ ...profileForm, phone: e.target.value })
            }
          />
        </label>

        <button type="submit" disabled={profileSaving}>
          {profileSaving ? "Сохраняем..." : "Сохранить"}
        </button>
      </form>

      {profileMessage && (
        <p className="profile-settings-message">{profileMessage}</p>
      )}
    </section>
  );
}