import math

# Allowable maximums (can be taken from project settings in future)
DEFAULT_MAX_VDROP_PERCENT = {
	"LV": 5,
	"MV": 10,
	"CONTROL": 15,
}


def full_load_current_kw(load_kw, voltage, pf, eff):
	"""Calculate full load current from kW."""
	if voltage == 0 or pf == 0 or eff == 0:
		return 0
	return (load_kw * 1000) / (math.sqrt(3) * voltage * pf * eff)


def full_load_current_kva(load_kva, voltage):
	"""Calculate full load current from kVA."""
	if voltage == 0:
		return 0
	return (load_kva * 1000) / (math.sqrt(3) * voltage)


def derated_current(i_base, d_factors):
	"""Derate current based on multiple correction factors."""
	d_total = 1
	for f in d_factors:
		d_total *= f
	if d_total == 0:
		return float("inf")
	return i_base / d_total


def voltage_drop_percent(i_load, length, mv_per_a_m, voltage):
	"""Voltage drop calculation using mv/A/m method."""
	# Backwards-compatible: if mv_per_a_m provided, it is expected in mV per A per m
	# (i.e. mV/A/m). To convert to volts for the total run: (mv_per_a_m * I * L) / 1000
	# For three-phase the line-to-line drop uses sqrt(3).
	if voltage == 0:
		return 0
	try:
		mv = float(mv_per_a_m or 0)
	except Exception:
		mv = 0.0

	# Convert mV to V by dividing by 1000
	vdrop_volts = math.sqrt(3) * i_load * length * (mv / 1000.0)
	# Percentage of nominal voltage
	return (vdrop_volts / voltage) * 100


def voltage_drop_percent_from_rx(i_load: float, length: float, r_ohm_per_km: float, x_ohm_per_km: float, voltage: float, pf: float = 1.0, three_phase: bool = True) -> float:
	"""Voltage drop calculation using R and X (ohm/km).

	Computes Vdrop using standard three-phase formula:
	Vdrop (V) = sqrt(3) * I * L(m) * (R_ohm_per_km/1000 * cos(phi) + X_ohm_per_km/1000 * sin(phi))
	Returns percent = Vdrop / voltage * 100
	"""
	if voltage == 0:
		return 0
	# cos(phi) approximated by PF, sin(phi) from PF
	cos_phi = float(pf)
	sin_phi = math.sqrt(max(0.0, 1.0 - cos_phi * cos_phi))
	# convert ohm/km to ohm/m by dividing by 1000
	r_per_m = float(r_ohm_per_km) / 1000.0
	x_per_m = float(x_ohm_per_km) / 1000.0
	vdrop_v = (math.sqrt(3) if three_phase else 1.0) * i_load * length * (r_per_m * cos_phi + x_per_m * sin_phi)
	return (vdrop_v / voltage) * 100


def short_circuit_check(i_sc, duration, k_const, csa):
	"""SC Check: Required area vs selected cable CSA."""
	try:
		a_required = (i_sc * math.sqrt(duration)) / k_const
		return a_required <= csa, a_required
	except:
		return False, 0


def motor_start_multiplier(start_method: str = "DOL") -> float:
	"""Get starting current multiplier based on motor start method.
	
	- DOL (Direct On Line): 6x FLC
	- Star-Delta: 3x FLC
	- VFD: 1.2x FLC
	"""
	method = (start_method or "DOL").upper().strip()
	multipliers = {
		"DOL": 6.0,
		"DIRECT": 6.0,
		"STAR_DELTA": 3.0,
		"STAR-DELTA": 3.0,
		"VFD": 1.2,
		"VARIABLE": 1.2,
	}
	return multipliers.get(method, 6.0)


def motor_start_vdrop_percent(i_load: float, start_method: str, length: float, r_ohm_per_km: float, x_ohm_per_km: float, voltage: float, pf: float = 1.0) -> tuple[float, float]:
	"""Calculate motor starting voltage drop.
	
	Returns (starting_vdrop_percent, starting_current).
	Uses motor_start_multiplier to get start current from FLC.
	Then computes Vdrop at that current.
	"""
	start_mult = motor_start_multiplier(start_method)
	i_start = i_load * start_mult
	vdrop_start = voltage_drop_percent_from_rx(i_start, length, r_ohm_per_km, x_ohm_per_km, voltage, pf)
	return vdrop_start, i_start

