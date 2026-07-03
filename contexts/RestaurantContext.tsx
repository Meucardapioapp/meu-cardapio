"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

type RestaurantContextType = {
  logo: string;
  setLogo: (logo: string) => void;

  corPrincipal: string;
  setCorPrincipal: (cor: string) => void;
};

const RestaurantContext =
  createContext<RestaurantContextType | null>(null);

type ProviderProps = {
  children: ReactNode;

  initialLogo?: string;

  initialCorPrincipal?: string;
};

export function RestaurantProvider({
  children,
  initialLogo = "",
  initialCorPrincipal = "#6D1F2F",
}: ProviderProps) {
  const [logo, setLogo] =
    useState(initialLogo);

  const [corPrincipal, setCorPrincipal] =
    useState(initialCorPrincipal);

  return (
    <RestaurantContext.Provider
      value={{
        logo,
        setLogo,
        corPrincipal,
        setCorPrincipal,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context =
    useContext(RestaurantContext);

  if (!context) {
    throw new Error(
      "useRestaurant deve ser usado dentro do RestaurantProvider"
    );
  }

  return context;
}