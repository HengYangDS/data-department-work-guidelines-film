"""This film's declaration and listening plan on the engine release that the lock pins."""

import hashlib
import importlib.metadata
import re
import tomllib
from pathlib import Path

import filmkit
import filmkit.film as film
import filmkit.repository as repository
from filmkit.production import CODES, Edition
from filmkit.review.listening_plan import listening_plan

# Han characters and CJK or full-width punctuation.
CHINESE = re.compile(r"[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]")
# The release the lock pins the engine to, by its tag.
ENGINE_SOURCE = re.compile(r"^https://github\.com/HengYangDS/filmkit\?tag=v([^#]+)#[0-9a-f]{40}$")
# The SHA-256 of the listening plan derived from the v1.3.0 repair's scripts, casts, contract and
# readings.
PLAN_SHA256 = "b9c7d20b817328405241e19d7ae2b66cf79def65be4b39fddc020165399ecc85"


def test_the_declaration_loads_with_both_editions():
    assert film.load(repository.ROOT) == film.FILM
    assert tuple(film.FILM.editions) == CODES


def test_the_engine_is_the_release_the_lock_pins():
    lock = tomllib.loads((repository.ROOT / "uv.lock").read_text())
    [engine] = [package for package in lock["package"] if package["name"] == "filmkit"]
    tag = ENGINE_SOURCE.match(engine["source"]["git"])
    assert tag is not None, engine["source"]
    assert tag.group(1) == engine["version"] == importlib.metadata.version("filmkit")
    # The engine is installed, not carried: its package lies outside the film's tracked tree.
    assert "site-packages" in Path(filmkit.__path__[0]).parts


def test_each_edition_declares_the_summary_its_player_shows():
    assert CHINESE.search(film.FILM.editions["zh"].summary) is not None
    assert film.FILM.editions["en"].summary
    assert CHINESE.search(film.FILM.editions["en"].summary) is None


def test_the_declaration_holds_the_palette_of_the_players():
    assert film.FILM.player.model_dump() == {
        "background": "#0F1519",
        "text": "#ECE8DF",
        "muted": "#9BA8B1",
        "line": "#34424E",
        "accent": "#7DB7D8",
    }


def test_no_edition_holds_a_player_of_its_own():
    # The engine renders each edition's player from the declaration.
    for code in CODES:
        assert not (repository.ROOT / Edition(code).sources / "player.html").exists()


def test_the_listening_plan_is_the_one_the_v1_3_0_repair_derives(tmp_path):
    out = tmp_path / "listening-plan.json"
    listening_plan(out)
    assert hashlib.sha256(out.read_bytes()).hexdigest() == PLAN_SHA256
