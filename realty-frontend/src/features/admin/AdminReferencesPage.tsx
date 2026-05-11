import { useEffect, useState } from "react";
import {
  createCity,
  createDistrict,
  createLivingRule,
  deleteCity,
  deleteDistrict,
  deleteLivingRule,
  getCities,
  getDistricts,
  getLivingRules,
  updateCity,
  updateDistrict,
  updateLivingRule,
  type City,
  type District,
  type LivingRule,
} from "../../api/referenceApi";
import "./AdminReferencesPage.css";

export function AdminReferencesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [rules, setRules] = useState<LivingRule[]>([]);

  const [cityName, setCityName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [districtCityId, setDistrictCityId] = useState<number | "">("");
  const [ruleName, setRuleName] = useState("");

  const [editingCityId, setEditingCityId] = useState<number | null>(null);
  const [editingCityName, setEditingCityName] = useState("");

  const [editingDistrictId, setEditingDistrictId] = useState<number | null>(null);
  const [editingDistrictName, setEditingDistrictName] = useState("");
  const [editingDistrictCityId, setEditingDistrictCityId] = useState<number | "">("");

  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editingRuleName, setEditingRuleName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  async function loadReferences() {
    try {
      setLoading(true);
      setError("");

      const [citiesData, rulesData] = await Promise.all([
        getCities(),
        getLivingRules(),
      ]);

      const districtGroups = await Promise.all(
        citiesData.map((city) => getDistricts(city.id)),
      );

      setCities(citiesData);
      setRules(rulesData);
      setDistricts(districtGroups.flat());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки справочников");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCity(e: React.FormEvent) {
    e.preventDefault();

    const name = cityName.trim();
    if (!name) return;

    try {
      setSaving(true);
      setError("");

      const created = await createCity({ name });
      setCities((prev) => [...prev, created]);
      setCityName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания города");
    } finally {
      setSaving(false);
    }
  }

  function startEditCity(city: City) {
    setEditingCityId(city.id);
    setEditingCityName(city.name);
  }

  function cancelEditCity() {
    setEditingCityId(null);
    setEditingCityName("");
  }

  async function handleUpdateCity(cityId: number) {
    const name = editingCityName.trim();
    if (!name) return;

    try {
      setSaving(true);
      setError("");

      const updated = await updateCity(cityId, { name });
      setCities((prev) => prev.map((city) => (city.id === cityId ? updated : city)));
      cancelEditCity();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка обновления города");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCity(city: City) {
    const confirmed = window.confirm(
      `Удалить город "${city.name}"? Если к нему привязаны районы или объявления, сервер может запретить удаление.`,
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      await deleteCity(city.id);
      setCities((prev) => prev.filter((item) => item.id !== city.id));
      setDistricts((prev) => prev.filter((district) => district.cityId !== city.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления города");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateDistrict(e: React.FormEvent) {
    e.preventDefault();

    const name = districtName.trim();
    if (!name || !districtCityId) return;

    try {
      setSaving(true);
      setError("");

      const created = await createDistrict({
        name,
        cityId: districtCityId,
      });

      setDistricts((prev) => [...prev, created]);
      setDistrictName("");
      setDistrictCityId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания района");
    } finally {
      setSaving(false);
    }
  }

  function startEditDistrict(district: District) {
    setEditingDistrictId(district.id);
    setEditingDistrictName(district.name);
    setEditingDistrictCityId(district.cityId);
  }

  function cancelEditDistrict() {
    setEditingDistrictId(null);
    setEditingDistrictName("");
    setEditingDistrictCityId("");
  }

  async function handleUpdateDistrict(districtId: number) {
    const name = editingDistrictName.trim();
    if (!name || !editingDistrictCityId) return;

    try {
      setSaving(true);
      setError("");

      const updated = await updateDistrict(districtId, {
        name,
        cityId: editingDistrictCityId,
      });

      setDistricts((prev) =>
        prev.map((district) => (district.id === districtId ? updated : district)),
      );

      cancelEditDistrict();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка обновления района");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDistrict(district: District) {
    const confirmed = window.confirm(`Удалить район "${district.name}"?`);
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      await deleteDistrict(district.id);
      setDistricts((prev) => prev.filter((item) => item.id !== district.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления района");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();

    const name = ruleName.trim();
    if (!name) return;

    try {
      setSaving(true);
      setError("");

      const created = await createLivingRule({ name });
      setRules((prev) => [...prev, created]);
      setRuleName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания правила");
    } finally {
      setSaving(false);
    }
  }

  function startEditRule(rule: LivingRule) {
    setEditingRuleId(rule.id);
    setEditingRuleName(rule.name);
  }

  function cancelEditRule() {
    setEditingRuleId(null);
    setEditingRuleName("");
  }

  async function handleUpdateRule(ruleId: number) {
    const name = editingRuleName.trim();
    if (!name) return;

    try {
      setSaving(true);
      setError("");

      const updated = await updateLivingRule(ruleId, { name });
      setRules((prev) => prev.map((rule) => (rule.id === ruleId ? updated : rule)));
      cancelEditRule();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка обновления правила");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRule(rule: LivingRule) {
    const confirmed = window.confirm(`Удалить правило "${rule.name}"?`);
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      await deleteLivingRule(rule.id);
      setRules((prev) => prev.filter((item) => item.id !== rule.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления правила");
    } finally {
      setSaving(false);
    }
  }

  function getCityName(cityId: number) {
    return cities.find((city) => city.id === cityId)?.name ?? "Город не найден";
  }

  useEffect(() => {
    loadReferences();
  }, []);

  return (
    <main className="admin-references-page">
      <div className="admin-references-header">
        <div>
          <p>Справочники</p>
          <h1>Города, районы и правила</h1>
        </div>

        <button type="button" onClick={loadReferences} disabled={loading}>
          Обновить всё
        </button>
      </div>

      {error && <div className="admin-references-error">{error}</div>}

      {loading ? (
        <div className="admin-reference-state">Загрузка справочников...</div>
      ) : (
        <div className="admin-references-layout">
          <section className="admin-reference-section">
            <div className="admin-reference-section-header">
              <div>
                <h2>Города</h2>
                <p>Добавляй, редактируй и удаляй города для объявлений.</p>
              </div>
            </div>

            <form className="admin-reference-form" onSubmit={handleCreateCity}>
              <input
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="Название города"
                disabled={saving}
              />

              <button type="submit" disabled={saving || !cityName.trim()}>
                Добавить
              </button>
            </form>

            <div className="admin-reference-list">
              {cities.map((city) => {
                const isEditing = editingCityId === city.id;

                return (
                  <article className="admin-reference-item" key={city.id}>
                    <div className="admin-reference-item-main">
                      <span>#{city.id}</span>

                      {isEditing ? (
                        <input
                          value={editingCityName}
                          onChange={(e) => setEditingCityName(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <strong>{city.name}</strong>
                      )}
                    </div>

                    <div className="admin-reference-actions">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateCity(city.id)}
                            disabled={saving || !editingCityName.trim()}
                          >
                            Сохранить
                          </button>

                          <button
                            type="button"
                            className="admin-reference-secondary"
                            onClick={cancelEditCity}
                            disabled={saving}
                          >
                            Отмена
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditCity(city)}
                            disabled={saving}
                          >
                            Изменить
                          </button>

                          <button
                            type="button"
                            className="admin-reference-danger"
                            onClick={() => handleDeleteCity(city)}
                            disabled={saving}
                          >
                            Удалить
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}

              {cities.length === 0 && (
                <div className="admin-reference-empty">Городов пока нет.</div>
              )}
            </div>
          </section>

          <section className="admin-reference-section">
            <div className="admin-reference-section-header">
              <div>
                <h2>Районы</h2>
                <p>Район всегда привязан к конкретному городу.</p>
              </div>
            </div>

            <form className="admin-reference-form" onSubmit={handleCreateDistrict}>
              <select
                value={districtCityId}
                onChange={(e) => setDistrictCityId(Number(e.target.value))}
                disabled={saving || cities.length === 0}
              >
                <option value="">Выберите город</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>

              <input
                value={districtName}
                onChange={(e) => setDistrictName(e.target.value)}
                placeholder="Название района"
                disabled={saving}
              />

              <button
                type="submit"
                disabled={saving || !districtName.trim() || !districtCityId}
              >
                Добавить
              </button>
            </form>

            <div className="admin-reference-list">
              {districts.map((district) => {
                const isEditing = editingDistrictId === district.id;

                return (
                  <article className="admin-reference-item" key={district.id}>
                    <div className="admin-reference-item-main">
                      <span>#{district.id}</span>

                      {isEditing ? (
                        <div className="admin-reference-edit-group">
                          <select
                            value={editingDistrictCityId}
                            onChange={(e) =>
                              setEditingDistrictCityId(Number(e.target.value))
                            }
                            disabled={saving}
                          >
                            <option value="">Выберите город</option>
                            {cities.map((city) => (
                              <option key={city.id} value={city.id}>
                                {city.name}
                              </option>
                            ))}
                          </select>

                          <input
                            value={editingDistrictName}
                            onChange={(e) => setEditingDistrictName(e.target.value)}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div>
                          <strong>{district.name}</strong>
                          <small>{getCityName(district.cityId)}</small>
                        </div>
                      )}
                    </div>

                    <div className="admin-reference-actions">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateDistrict(district.id)}
                            disabled={
                              saving ||
                              !editingDistrictName.trim() ||
                              !editingDistrictCityId
                            }
                          >
                            Сохранить
                          </button>

                          <button
                            type="button"
                            className="admin-reference-secondary"
                            onClick={cancelEditDistrict}
                            disabled={saving}
                          >
                            Отмена
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditDistrict(district)}
                            disabled={saving}
                          >
                            Изменить
                          </button>

                          <button
                            type="button"
                            className="admin-reference-danger"
                            onClick={() => handleDeleteDistrict(district)}
                            disabled={saving}
                          >
                            Удалить
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}

              {districts.length === 0 && (
                <div className="admin-reference-empty">Районов пока нет.</div>
              )}
            </div>
          </section>

          <section className="admin-reference-section">
            <div className="admin-reference-section-header">
              <div>
                <h2>Правила проживания</h2>
                <p>Например: можно с животными, нельзя курить, без вечеринок.</p>
              </div>
            </div>

            <form className="admin-reference-form" onSubmit={handleCreateRule}>
              <input
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Название правила"
                disabled={saving}
              />

              <button type="submit" disabled={saving || !ruleName.trim()}>
                Добавить
              </button>
            </form>

            <div className="admin-reference-list">
              {rules.map((rule) => {
                const isEditing = editingRuleId === rule.id;

                return (
                  <article className="admin-reference-item" key={rule.id}>
                    <div className="admin-reference-item-main">
                      <span>#{rule.id}</span>

                      {isEditing ? (
                        <input
                          value={editingRuleName}
                          onChange={(e) => setEditingRuleName(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <strong>{rule.name}</strong>
                      )}
                    </div>

                    <div className="admin-reference-actions">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateRule(rule.id)}
                            disabled={saving || !editingRuleName.trim()}
                          >
                            Сохранить
                          </button>

                          <button
                            type="button"
                            className="admin-reference-secondary"
                            onClick={cancelEditRule}
                            disabled={saving}
                          >
                            Отмена
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditRule(rule)}
                            disabled={saving}
                          >
                            Изменить
                          </button>

                          <button
                            type="button"
                            className="admin-reference-danger"
                            onClick={() => handleDeleteRule(rule)}
                            disabled={saving}
                          >
                            Удалить
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}

              {rules.length === 0 && (
                <div className="admin-reference-empty">
                  Правил проживания пока нет.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}