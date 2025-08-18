"use client";

import React from "react";
import {
  ArrowRight,
  Shield,
  Users,
  Brain,
  Smartphone,
  BookOpen,
  Award,
} from "lucide-react";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguageStore } from "../lib/stores/languageStore";

const Home = () => {
  const { t } = useLanguageStore();
  const features = [
    {
      icon: BookOpen,
      title: t("feature_interactive_title"),
      description: t("feature_interactive_desc"),
    },
    {
      icon: Brain,
      title: t("feature_ai_title"),
      description: t("feature_ai_desc"),
    },
    {
      icon: Award,
      title: t("feature_progress_title"),
      description: t("feature_progress_desc"),
    },
    {
      icon: Smartphone,
      title: t("feature_mobile_title"),
      description: t("feature_mobile_desc"),
    },
  ];

  const stats = [
    { number: "10+", label: t("stats_modules") },
    { number: "500+", label: t("stats_students") },
    { number: "50+", label: t("stats_schools") },
    { number: "95%", label: t("stats_completion") },
  ];

  return (
    <>
      <LanguageSwitcher />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br mb-10 from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t("hero_title")}
              <span className="block text-blue-200">
                {t("hero_title_highlight")}
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              {t("hero_description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login?role=student"
                className="inline-flex items-center px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg transition-colors shadow-lg"
              >
                {t("start_learning")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/login?role=student"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 hover:bg-gray-50 font-semibold rounded-lg transition-colors shadow-lg"
              >
                {t("try_ai_assistant")}
                <Brain className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl  mb-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mb-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            {t("why_choose_title")}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t("why_choose_desc")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("cta_title")}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t("cta_desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login?role=student"
                className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
              >
                <Users className="mr-2 h-5 w-5" />
                {t("join_as_student")}
              </Link>
              <Link
                href="/login?role=teacher"
                className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
              >
                <Shield className="mr-2 h-5 w-5" />
                {t("teacher_access")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
