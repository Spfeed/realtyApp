import { useEffect, useRef, useState } from "react";
import type { City, District } from "../../api/referenceApi";
import type { ListingsFilterState } from "./ListingsPage";

type Props = {
  filter: ListingsFilterState;
  setFilter: React.Dispatch<React.SetStateAction<ListingsFilterState>>;
  cities: City[];
  districts: District[];
  onSubmit: (e?: React.FormEvent) => void;
  onReset: () => void;
};

export function ListingsFilterDropdown({
  filter,
  setFilter,
  cities,
  districts,
  onSubmit,
  onReset,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="listings-filter-dropdown"  ref={dropdownRef}>
      <button
        type="button"
        className="listings-filter-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        Фильтры
        <span>{isOpen ? "↑" : "↓"}</span>
      </button>

      {isOpen && (
        <form className="listings-filters-panel" onSubmit={onSubmit}>
          <select
            value={filter.cityId}
            onChange={(e) => setFilter({ ...filter, cityId: e.target.value })}
            className="listings-control"
          >
            <option value="">Все города</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>

          <select
            value={filter.districtId}
            onChange={(e) =>
              setFilter({ ...filter, districtId: e.target.value })
            }
            disabled={!filter.cityId}
            className="listings-control"
          >
            <option value="">Все районы</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Цена от"
            value={filter.minPrice}
            onChange={(e) => setFilter({ ...filter, minPrice: e.target.value })}
            className="listings-control"
          />

          <input
            type="number"
            placeholder="Цена до"
            value={filter.maxPrice}
            onChange={(e) => setFilter({ ...filter, maxPrice: e.target.value })}
            className="listings-control"
          />

          <input
            type="number"
            placeholder="Площадь от"
            value={filter.minArea}
            onChange={(e) => setFilter({ ...filter, minArea: e.target.value })}
            className="listings-control"
          />

          <input
            type="number"
            placeholder="Площадь до"
            value={filter.maxArea}
            onChange={(e) => setFilter({ ...filter, maxArea: e.target.value })}
            className="listings-control"
          />

          <select
            value={filter.utilitiesIncluded}
            onChange={(e) =>
              setFilter({ ...filter, utilitiesIncluded: e.target.value })
            }
            className="listings-control"
          >
            <option value="">ЖКХ: не важно</option>
            <option value="true">ЖКХ включено</option>
            <option value="false">ЖКХ не включено</option>
          </select>

          <input
            type="number"
            placeholder="Макс. залог"
            value={filter.maxDepositAmount}
            onChange={(e) =>
              setFilter({ ...filter, maxDepositAmount: e.target.value })
            }
            className="listings-control"
          />

          <input
            type="number"
            min="1"
            placeholder="Этаж от"
            value={filter.minFloor}
            onChange={(e) => setFilter({ ...filter, minFloor: e.target.value })}
            className="listings-control"
          />

          <input
            type="number"
            min="1"
            placeholder="Этаж до"
            value={filter.maxFloor}
            onChange={(e) => setFilter({ ...filter, maxFloor: e.target.value })}
            className="listings-control"
          />

          <select
            value={filter.hasElevator}
            onChange={(e) =>
              setFilter({ ...filter, hasElevator: e.target.value })
            }
            className="listings-control"
          >
            <option value="">Лифт: не важно</option>
            <option value="true">Есть лифт</option>
            <option value="false">Без лифта</option>
          </select>

          <div className="listings-filter-actions">
            <button type="submit" className="listings-filter-submit">
              Найти
            </button>
            <button
              type="button"
              className="listings-filter-reset"
              onClick={onReset}
            >
              Сбросить
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
