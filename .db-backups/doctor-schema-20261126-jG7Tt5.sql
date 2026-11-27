--
-- PostgreSQL database dump
--

\restrict 4xKfmLB36Nb87umXwJwZIZlfaa1bUhobywoXufraAdjIgnkk66rfuePxtcPI77G

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Doctor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Doctor" (
    id text NOT NULL,
    "userId" text,
    name text NOT NULL,
    specialization text NOT NULL,
    phone text,
    email text,
    "baseSalary" double precision DEFAULT 0 NOT NULL,
    "payType" text DEFAULT 'MONTHLY'::text NOT NULL,
    "perPatientShare" double precision DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "penaltyPolicy" jsonb
);


ALTER TABLE public."Doctor" OWNER TO postgres;

--
-- Name: DoctorAttendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DoctorAttendance" (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    "dateStr" text NOT NULL,
    status text DEFAULT 'PRESENT'::text NOT NULL,
    "checkInTime" text,
    "checkOutTime" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DoctorAttendance" OWNER TO postgres;

--
-- Name: DoctorPayroll; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DoctorPayroll" (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "basePay" double precision DEFAULT 0 NOT NULL,
    "workingDays" integer DEFAULT 0 NOT NULL,
    "totalVisits" integer DEFAULT 0 NOT NULL,
    bonuses double precision DEFAULT 0 NOT NULL,
    deductions double precision DEFAULT 0 NOT NULL,
    "netPay" double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "penaltyBreakdown" jsonb
);


ALTER TABLE public."DoctorPayroll" OWNER TO postgres;

--
-- Name: DoctorAttendance DoctorAttendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DoctorAttendance"
    ADD CONSTRAINT "DoctorAttendance_pkey" PRIMARY KEY (id);


--
-- Name: DoctorPayroll DoctorPayroll_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DoctorPayroll"
    ADD CONSTRAINT "DoctorPayroll_pkey" PRIMARY KEY (id);


--
-- Name: Doctor Doctor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Doctor"
    ADD CONSTRAINT "Doctor_pkey" PRIMARY KEY (id);


--
-- Name: DoctorAttendance_dateStr_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DoctorAttendance_dateStr_idx" ON public."DoctorAttendance" USING btree ("dateStr");


--
-- Name: DoctorAttendance_doctorId_dateStr_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DoctorAttendance_doctorId_dateStr_key" ON public."DoctorAttendance" USING btree ("doctorId", "dateStr");


--
-- Name: DoctorAttendance_doctorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DoctorAttendance_doctorId_idx" ON public."DoctorAttendance" USING btree ("doctorId");


--
-- Name: DoctorAttendance_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DoctorAttendance_status_idx" ON public."DoctorAttendance" USING btree (status);


--
-- Name: DoctorPayroll_doctorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DoctorPayroll_doctorId_idx" ON public."DoctorPayroll" USING btree ("doctorId");


--
-- Name: DoctorPayroll_doctorId_year_month_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DoctorPayroll_doctorId_year_month_key" ON public."DoctorPayroll" USING btree ("doctorId", year, month);


--
-- Name: DoctorPayroll_year_month_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DoctorPayroll_year_month_idx" ON public."DoctorPayroll" USING btree (year, month);


--
-- Name: Doctor_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Doctor_isActive_idx" ON public."Doctor" USING btree ("isActive");


--
-- Name: Doctor_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Doctor_name_idx" ON public."Doctor" USING btree (name);


--
-- Name: Doctor_specialization_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Doctor_specialization_idx" ON public."Doctor" USING btree (specialization);


--
-- Name: Doctor_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Doctor_userId_key" ON public."Doctor" USING btree ("userId");


--
-- Name: DoctorAttendance DoctorAttendance_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DoctorAttendance"
    ADD CONSTRAINT "DoctorAttendance_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DoctorPayroll DoctorPayroll_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DoctorPayroll"
    ADD CONSTRAINT "DoctorPayroll_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Doctor Doctor_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Doctor"
    ADD CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 4xKfmLB36Nb87umXwJwZIZlfaa1bUhobywoXufraAdjIgnkk66rfuePxtcPI77G

