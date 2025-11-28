from pydantic import BaseModel
from typing import List, Optional


class CableInput(BaseModel):
	cable_number: Optional[str] = "TEST-001"
	load_kw: Optional[float] = 0
	load_kva: Optional[float] = 0
	current: Optional[float] = 0
	voltage: float
	pf: Optional[float] = 1.0
	eff: Optional[float] = 1.0
	length: float
	mv_per_a_m: float
	derating_factors: List[float]
	csa_options: List[float]  # available CSA sizes to pick from
	sc_current: Optional[float] = 0
	sc_time: Optional[float] = 1
	k_const: Optional[float] = 115


class CableOutput(BaseModel):
	cable_number: str
	flc: float
	derated_current: float
	selected_csa: float
	vdrop_percent: float
	sc_required_area: float
	sc_ok: bool
	vdrop_ok: bool

