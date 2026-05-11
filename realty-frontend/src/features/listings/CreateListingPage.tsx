import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  getCities,
  getDistricts,
  getLivingRules,
  type City,
  type District,
  type LivingRule,
} from "../../api/referenceApi";
import { createListing } from "../../api/listingApi";

export function CreateListingPage() {
  const navigate = useNavigate();

  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [rules, setRules] = useState<LivingRule[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    area: "",
    price: "",
    utilitiesIncluded: false,
    depositAmount: "",
    cityId: "",
    districtId: "",
    street: "",
    houseNumber: "",
    livingRuleIds: [] as number[],
  });

  const [error, setError] = useState("");

  useEffect(() => {
    getCities().then(setCities);
    getLivingRules().then(setRules);
  }, []);

  useEffect(() => {
    if (form.cityId) {
      getDistricts(Number(form.cityId)).then(setDistricts);
    }
  }, [form.cityId]);

  function toggleRule(id: number) {
    setForm((prev) => ({
      ...prev,
      livingRuleIds: prev.livingRuleIds.includes(id)
        ? prev.livingRuleIds.filter((r) => r !== id)
        : [...prev.livingRuleIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await createListing({
        ...form,
        area: Number(form.area),
        price: Number(form.price),
        depositAmount: Number(form.depositAmount),
        hasElevator: false,
        cityId: Number(form.cityId),
        districtId: form.districtId ? Number(form.districtId) : undefined,
      });

      navigate("/my-listings");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка создания");
    }
  }

  return (
    <div>
      <h1>Создать объявление</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Название"
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          placeholder="Описание"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <input
          placeholder="Площадь"
          onChange={(e) => setForm({ ...form, area: e.target.value })}
        />
        <input
          placeholder="Цена"
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <label>
          Коммуналка включена
          <input
            type="checkbox"
            onChange={(e) =>
              setForm({ ...form, utilitiesIncluded: e.target.checked })
            }
          />
        </label>

        <input
          placeholder="Залог"
          onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
        />

        <select onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
          <option>Выберите город</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          onChange={(e) => setForm({ ...form, districtId: e.target.value })}
        >
          <option>Выберите район</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Улица"
          onChange={(e) => setForm({ ...form, street: e.target.value })}
        />
        <input
          placeholder="Дом"
          onChange={(e) => setForm({ ...form, houseNumber: e.target.value })}
        />

        <h3>Правила проживания</h3>
        {rules.map((r) => (
          <label key={r.id}>
            <input type="checkbox" onChange={() => toggleRule(r.id)} />
            {r.name}
          </label>
        ))}

        <br />
        <button type="submit">Создать</button>
      </form>
    </div>
  );
}
