import { useEffect, useMemo, useState } from "react";
import {
  getCities,
  getDistricts,
  getLivingRules,
  type City,
  type District,
  type LivingRule,
} from "../../api/referenceApi";
import {
  createListing,
  deleteListing,
  updateListing,
  type Listing,
} from "../../api/listingApi";
import {
  deleteListingPhoto,
  getListingPhotos,
  setMainListingPhoto,
  uploadListingPhotos,
  type ListingPhoto,
} from "../../api/listingPhotoApi";
import "./CreateListingModal.css";

import { ProtectedImage } from "../../components/ProtectedImage";

type Props = {
  isOpen: boolean;
  listingToEdit?: Listing | null;
  onDelete?: () => void | Promise<void>;
  onClose: () => void;
  onSuccess?: (listing: Listing) => void | Promise<void>;
};

type CreateListingForm = {
  title: string;
  description: string;
  area: string;
  price: string;
  utilitiesIncluded: boolean;
  depositAmount: string;
  floor: string;
  hasElevator: boolean;
  cityId: string;
  districtId: string;
  street: string;
  houseNumber: string;
  livingRuleIds: number[];
};

type CreateListingErrors = Partial<
  Record<keyof CreateListingForm | "general", string>
>;

const defaultForm: CreateListingForm = {
  title: "",
  description: "",
  area: "",
  price: "",
  utilitiesIncluded: false,
  depositAmount: "",
  floor: "",
  hasElevator: false,
  cityId: "",
  districtId: "",
  street: "",
  houseNumber: "",
  livingRuleIds: [],
};

function getListingRuleIds(listing: Listing, rules: LivingRule[]) {
  if ("livingRuleIds" in listing && Array.isArray(listing.livingRuleIds)) {
    return listing.livingRuleIds;
  }

  return rules
    .filter((rule) => listing.livingRules.includes(rule.name))
    .map((rule) => rule.id);
}

export function CreateListingModal({
  isOpen,
  listingToEdit = null,
  onDelete,
  onClose,
  onSuccess,
}: Props) {
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [rules, setRules] = useState<LivingRule[]>([]);

  const [form, setForm] = useState<CreateListingForm>(defaultForm);
  const [files, setFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<CreateListingErrors>({});

  const [existingPhotos, setExistingPhotos] = useState<ListingPhoto[]>([]);

  const isEditMode = Boolean(listingToEdit);

  const previewUrl = useMemo(() => {
    if (files.length === 0) return "";
    return URL.createObjectURL(files[0]);
  }, [files]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isOpen || !listingToEdit) {
      setExistingPhotos([]);
      return;
    }

    getListingPhotos(listingToEdit.id)
      .then(setExistingPhotos)
      .catch(() => setExistingPhotos([]));
  }, [isOpen, listingToEdit]);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);

      const timer = setTimeout(() => {
        setMounted(false);
        setClosing(false);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!isOpen) return;

    getCities()
      .then(setCities)
      .catch(() => setCities([]));

    getLivingRules()
      .then(setRules)
      .catch(() => setRules([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (listingToEdit) {
      setForm({
        title: listingToEdit.title ?? "",
        description: listingToEdit.description ?? "",
        area: String(listingToEdit.area ?? ""),
        price: String(listingToEdit.price ?? ""),
        utilitiesIncluded: Boolean(listingToEdit.utilitiesIncluded),
        depositAmount: String(listingToEdit.depositAmount ?? ""),
        floor: listingToEdit.floor != null ? String(listingToEdit.floor) : "",
        hasElevator: Boolean(listingToEdit.hasElevator),
        cityId: String(listingToEdit.cityId ?? ""),
        districtId: listingToEdit.districtId
          ? String(listingToEdit.districtId)
          : "",
        street: listingToEdit.street ?? "",
        houseNumber: listingToEdit.houseNumber ?? "",
        livingRuleIds: getListingRuleIds(listingToEdit, rules),
      });
    } else {
      setForm(defaultForm);
      setFiles([]);
    }

    setErrors({});
  }, [isOpen, listingToEdit, rules]);

  useEffect(() => {
    if (!form.cityId) {
      setDistricts([]);
      setForm((prev) => ({ ...prev, districtId: "" }));
      return;
    }

    getDistricts(Number(form.cityId))
      .then(setDistricts)
      .catch(() => setDistricts([]));
  }, [form.cityId]);

  useEffect(() => {
    if (!isOpen) return;

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, loading]);

  function handleClose() {
    if (loading) return;
    onClose();
  }

  async function handleDeletePhoto(photoId: number) {
    if (!listingToEdit) return;

    const confirmed = window.confirm("Удалить фото?");
    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteListingPhoto(photoId);

      const photos = await getListingPhotos(listingToEdit.id);
      setExistingPhotos(photos);
    } catch (e) {
      setErrors({
        general: e instanceof Error ? e.message : "Ошибка удаления фото",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSetMainPhoto(photoId: number) {
    if (!listingToEdit) return;

    try {
      setLoading(true);
      await setMainListingPhoto(photoId);

      const photos = await getListingPhotos(listingToEdit.id);
      setExistingPhotos(photos);
    } catch (e) {
      setErrors({
        general: e instanceof Error ? e.message : "Ошибка выбора главного фото",
      });
    } finally {
      setLoading(false);
    }
  }

  function updateForm<K extends keyof CreateListingForm>(
    key: K,
    value: CreateListingForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function toggleRule(id: number) {
    setForm((prev) => ({
      ...prev,
      livingRuleIds: prev.livingRuleIds.includes(id)
        ? prev.livingRuleIds.filter((ruleId) => ruleId !== id)
        : [...prev.livingRuleIds, id],
    }));
  }

  function validateForm() {
    const nextErrors: CreateListingErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "Введите название объявления";
    }

    if (!form.description.trim()) {
      nextErrors.description = "Введите описание объявления";
    }

    if (!form.area) {
      nextErrors.area = "Укажите площадь";
    } else if (Number(form.area) <= 0) {
      nextErrors.area = "Площадь должна быть больше 0";
    }

    if (!form.price) {
      nextErrors.price = "Укажите цену";
    } else if (Number(form.price) <= 0) {
      nextErrors.price = "Цена должна быть больше 0";
    }

    if (!form.depositAmount) {
      nextErrors.depositAmount = "Укажите залог";
    } else if (Number(form.depositAmount) < 0) {
      nextErrors.depositAmount = "Залог не может быть отрицательным";
    }

    if (form.floor && Number(form.floor) <= 0) {
      nextErrors.floor = "Этаж должен быть больше 0";
    }

    if (!form.cityId) {
      nextErrors.cityId = "Выберите город";
    }

    if (!form.districtId) {
      nextErrors.districtId = "Выберите район";
    }

    if (!form.street.trim()) {
      nextErrors.street = "Введите улицу";
    }

    if (!form.houseNumber.trim()) {
      nextErrors.houseNumber = "Введите номер дома";
    }

    return nextErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    try {
      setLoading(true);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        area: Number(form.area),
        price: Number(form.price),
        utilitiesIncluded: form.utilitiesIncluded,
        depositAmount: Number(form.depositAmount),
        floor: form.floor ? Number(form.floor) : null,
        hasElevator: form.hasElevator,
        cityId: Number(form.cityId),
        districtId: Number(form.districtId),
        street: form.street.trim(),
        houseNumber: form.houseNumber.trim(),
        livingRuleIds: form.livingRuleIds,
      };

      const savedListing =
        isEditMode && listingToEdit
          ? await updateListing(listingToEdit.id, payload)
          : await createListing(payload);

      if (files.length > 0) {
        await uploadListingPhotos(savedListing.id, files);
      }

      setForm(defaultForm);
      setFiles([]);

      await onSuccess?.(savedListing);
      onClose();
    } catch (e) {
      setErrors({
        general:
          e instanceof Error ? e.message : "Ошибка сохранения объявления",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!listingToEdit) return;

    const confirmed = window.confirm(
      "Удалить объявление? Это действие нельзя отменить.",
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setErrors({});

      await deleteListing(listingToEdit.id);

      setForm(defaultForm);
      setFiles([]);

      await onDelete?.();
      onClose();
    } catch (e) {
      setErrors({
        general: e instanceof Error ? e.message : "Ошибка удаления объявления",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div
      className={`create-listing-overlay ${
        closing ? "create-listing-overlay--closing" : ""
      }`}
      onMouseDown={handleClose}
    >
      <form
        className="create-listing-card"
        onSubmit={handleSubmit}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="create-listing-close"
          onClick={handleClose}
          disabled={loading}
          aria-label="Закрыть"
        >
          ×
        </button>

        <header className="create-listing-header">
          <div className="create-listing-brand">
            <img src="/icons/home.svg" alt="" />
            <span>StayVille</span>
          </div>

          <div>
            <h2>
              {isEditMode ? "Редактировать объявление" : "Создать объявление"}
            </h2>
            <p>
              {isEditMode
                ? "Обновите данные объявления и сохраните изменения"
                : "Добавьте подробности квартиры, чтобы привлекать гостей"}
            </p>
          </div>
        </header>

        <div className="create-listing-grid">
          <label className="create-listing-field create-listing-field--title">
            <span>Название *</span>
            <input
              data-testid="listing-title"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              placeholder="Уютная студия рядом с метро"
            />
            {errors.title && (
              <small className="create-listing-field-error">
                {errors.title}
              </small>
            )}
          </label>

          <label className="create-listing-field">
            <span>Площадь (м²) *</span>
            <input
              data-testid="listing-area"
              type="number"
              step="0.01"
              min="0"
              value={form.area}
              onChange={(e) => updateForm("area", e.target.value)}
              placeholder="45.5"
            />
            {errors.area && (
              <small className="create-listing-field-error">
                {errors.area}
              </small>
            )}
          </label>

          <label className="create-listing-field">
            <span>Цена (₽/мес) *</span>
            <input
              data-testid="listing-price"
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => updateForm("price", e.target.value)}
              placeholder="35000"
            />
            {errors.price && (
              <small className="create-listing-field-error">
                {errors.price}
              </small>
            )}
          </label>

          <label className="create-listing-field create-listing-field--description">
            <span>Описание *</span>
            <textarea
              data-testid="listing-description"
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="Опишите квартиру: сколько спальных мест, какая мебель, что рядом"
            />
            {errors.description && (
              <small className="create-listing-field-error">
                {errors.description}
              </small>
            )}
          </label>

          <div className="create-listing-field create-listing-checkbox-field">
            <span>
              Оплата ЖКХ <small>(необязательно)</small>
            </span>

            <label className="create-listing-checkbox">
              <input
                type="checkbox"
                checked={form.utilitiesIncluded}
                onChange={(e) =>
                  updateForm("utilitiesIncluded", e.target.checked)
                }
              />
              <span />
              Да, коммунальные услуги включены
            </label>
          </div>

          <label className="create-listing-field">
            <span>Залог (₽) *</span>
            <input
              data-testid="listing-deposit"
              type="number"
              min="0"
              value={form.depositAmount}
              onChange={(e) => updateForm("depositAmount", e.target.value)}
              placeholder="35000"
            />
            {errors.depositAmount && (
              <small className="create-listing-field-error">
                {errors.depositAmount}
              </small>
            )}
          </label>

          <label className="create-listing-field">
            <span>
              Этаж <small>(необязательно)</small>
            </span>
            <input
              data-testid="listing-floor"
              type="number"
              min="1"
              value={form.floor}
              onChange={(e) => updateForm("floor", e.target.value)}
              placeholder="5"
            />
            {errors.floor && (
              <small className="create-listing-field-error">
                {errors.floor}
              </small>
            )}
          </label>

          <div className="create-listing-field create-listing-checkbox-field">
            <span>
              Лифт <small>(необязательно)</small>
            </span>

            <label className="create-listing-checkbox">
              <input
                type="checkbox"
                checked={form.hasElevator}
                onChange={(e) => updateForm("hasElevator", e.target.checked)}
              />
              <span />В доме есть лифт
            </label>
          </div>

          <label className="create-listing-field">
            <span>Город *</span>
            <select
              data-testid="listing-city"
              value={form.cityId}
              onChange={(e) => updateForm("cityId", e.target.value)}
            >
              <option value="">Выберите город</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            {errors.cityId && (
              <small className="create-listing-field-error">
                {errors.cityId}
              </small>
            )}
          </label>

          <label className="create-listing-field">
            <span>Район *</span>
            <select
              data-testid="listing-district"
              value={form.districtId}
              onChange={(e) => updateForm("districtId", e.target.value)}
              disabled={!form.cityId}
            >
              <option value="">Выберите район</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
            {errors.districtId && (
              <small className="create-listing-field-error">
                {errors.districtId}
              </small>
            )}
          </label>

          <div className="create-listing-address-row">
            <label className="create-listing-field">
              <span>Улица *</span>
              <input
                data-testid="listing-street"
                value={form.street}
                onChange={(e) => updateForm("street", e.target.value)}
                placeholder="Арбат"
              />
              {errors.street && (
                <small className="create-listing-field-error">
                  {errors.street}
                </small>
              )}
            </label>

            <label className="create-listing-field">
              <span>Дом *</span>
              <input
                data-testid="listing-house"
                value={form.houseNumber}
                onChange={(e) => updateForm("houseNumber", e.target.value)}
                placeholder="12А"
              />
              {errors.houseNumber && (
                <small className="create-listing-field-error">
                  {errors.houseNumber}
                </small>
              )}
            </label>
          </div>
        </div>

        <section className="create-listing-rules">
          <h3>Правила проживания</h3>
          <p className="create-listing-rules-hint">
            Выберите одно или несколько правил проживания. Если вы не нашли
            нужное правило в списке — укажите его в описании объявления.
          </p>

          <div className="create-listing-rules-grid">
            {rules.map((rule) => (
              <label key={rule.id} className="create-listing-rule">
                <input
                  type="checkbox"
                  checked={form.livingRuleIds.includes(rule.id)}
                  onChange={() => toggleRule(rule.id)}
                />
                <span className="create-listing-check" />

                <div>
                  <b>{rule.name}</b>
                  {"description" in rule && rule.description ? (
                    <small>{String(rule.description)}</small>
                  ) : (
                    <small>Правило будет отображаться в объявлении</small>
                  )}
                </div>
              </label>
            ))}
          </div>
        </section>

        {isEditMode && existingPhotos.length > 0 && (
          <div className="create-listing-existing-photos">
            <h3>Текущие фото</h3>

            <div className="create-listing-existing-photos-grid">
              {existingPhotos.map((photo) => (
                <div key={photo.id} className="create-listing-existing-photo">
                  <ProtectedImage
                    src={photo.url}
                    alt="Фото объявления"
                    className="create-listing-existing-photo-img"
                    placeholderClassName="create-listing-existing-photo-img"
                  />

                  {photo.isMain && (
                    <span className="create-listing-main-badge">Главное</span>
                  )}

                  <div className="create-listing-photo-actions">
                    {!photo.isMain && (
                      <button
                        type="button"
                        onClick={() => handleSetMainPhoto(photo.id)}
                        disabled={loading}
                      >
                        Сделать главным
                      </button>
                    )}

                    <button
                      type="button"
                      className="create-listing-photo-delete"
                      onClick={() => handleDeletePhoto(photo.id)}
                      disabled={loading}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <section className="create-listing-bottom">
          <label className="create-listing-upload">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />

            {previewUrl ? (
              <img src={previewUrl} alt="Превью изображения" />
            ) : (
              <div className="create-listing-upload-placeholder">Фото</div>
            )}

            <div>
              <b>
                Фото объявления <small>(необязательно)</small>
              </b>
              <span>
                {files.length > 0
                  ? `Выбрано файлов: ${files.length}`
                  : isEditMode
                    ? "Можно добавить новые фото к объявлению"
                    : "Добавьте фото, чтобы посетители лучше увидели объект"}
              </span>
            </div>
          </label>

          <div className="create-listing-actions">
            {isEditMode && (
              <button
                type="button"
                className="create-listing-delete"
                onClick={handleDelete}
                disabled={loading}
              >
                Удалить
              </button>
            )}

            <button
              type="button"
              className="create-listing-cancel"
              onClick={handleClose}
              disabled={loading}
            >
              Отменить
            </button>

            <button
              data-testid="listing-submit"
              type="submit"
              className="create-listing-submit"
              disabled={loading}
            >
              {loading
                ? isEditMode
                  ? "Сохраняем..."
                  : "Публикуем..."
                : isEditMode
                  ? "Сохранить изменения"
                  : "Опубликовать объявление"}
            </button>
          </div>
        </section>

        {errors.general && (
          <p className="create-listing-error">{errors.general}</p>
        )}
      </form>
    </div>
  );
}
