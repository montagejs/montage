var Enumeration = require("montage/data/model/enumeration").Enumeration,
    Montage = require("montage").Montage;

describe("An Enumeration", function() {

    it("allows types to be defined by specialization", function () {
        var Color, Suit, black, red, spades, hearts, diamonds, clubs, unknown;
        // Define Color.
        Color = Enumeration.specialize("id", "name", {
            alternative: {
                get: function () {
                    return Color.COLORS[1 - Color.COLORS.indexOf(this)];
                }
            }
        }, {
            COLORS: {
                get: function () {
                    return [Color.BLACK, Color.RED];
                }
            }
        }, {
            BLACK: ["B", "Black"],
            RED: ["R", "Red"]
        });
        // Verify Color.
        black = Color.BLACK;
        expect(Color.BLACK).toBe(black);
        expect(Color.BLACK.id).toEqual("B");
        expect(Color.BLACK.name).toEqual("Black");
        expect(Color.BLACK.alternative).toBe(Color.RED);
        red = Color.RED;
        expect(Color.RED).toBe(red);
        expect(Color.RED.id).toEqual("R");
        expect(Color.RED.name).toEqual("Red");
        expect(Color.RED.alternative).toBe(Color.BLACK);
        expect(Color.COLORS).toEqual([Color.BLACK, Color.RED]);
        // Define Suit.
        Suit = Enumeration.specialize("id", "name", {
            color: {
                value: undefined
            }
        }, {
            SUITS: {
                get: function () {
                    return [Suit.SPADE, Suit.HEART, Suit.DIAMOND, Suit.CLUB];
                }
            },
            BLACKS: {
                get: function () {
                    return Suit.SUITS.filter(function (suit) {
                        return suit.color === Color.BLACK;
                    });
                }
            },
            REDS: {
                get: function () {
                    return Suit.SUITS.filter(function (suit) {
                        return suit.color === Color.RED;
                    });
                }
            }
        }, {
            SPADE: ["S", "Spade", {color: {value: Color.BLACK}}],
            HEART: ["H", "Heart", {color: {value: Color.RED}}],
            DIAMOND: ["D", "Diamond", {color: {value: Color.RED}}],
            CLUB: ["C", "Club", {color: {value: Color.BLACK}}],
            UNKNOWN: ["U", "Unknown"]
        });
        // Verify Suit.
        spades = Suit.SPADE;
        expect(Suit.SPADE).toBe(spades);
        expect(Suit.SPADE.id).toEqual("S");
        expect(Suit.SPADE.name).toEqual("Spade");
        expect(Suit.SPADE.color).toEqual(Color.BLACK);
        hearts = Suit.HEART;
        expect(Suit.HEART).toBe(hearts);
        expect(Suit.HEART.id).toEqual("H");
        expect(Suit.HEART.name).toEqual("Heart");
        expect(Suit.HEART.color).toEqual(Color.RED);
        diamonds = Suit.DIAMOND;
        expect(Suit.DIAMOND).toBe(diamonds);
        expect(Suit.DIAMOND.id).toEqual("D");
        expect(Suit.DIAMOND.name).toEqual("Diamond");
        expect(Suit.DIAMOND.color).toEqual(Color.RED);
        clubs = Suit.CLUB;
        expect(Suit.CLUB).toBe(clubs);
        expect(Suit.CLUB.id).toEqual("C");
        expect(Suit.CLUB.name).toEqual("Club");
        expect(Suit.CLUB.color).toEqual(Color.BLACK);
        unknown = Suit.UNKNOWN;
        expect(Suit.UNKNOWN).toBe(unknown);
        expect(Suit.UNKNOWN.id).toEqual("U");
        expect(Suit.UNKNOWN.name).toEqual("Unknown");
        expect(Suit.UNKNOWN.color).toBeUndefined();
        expect(Suit.SUITS).toEqual([Suit.SPADE, Suit.HEART, Suit.DIAMOND, Suit.CLUB]);
        expect(Suit.BLACKS).toEqual([Suit.SPADE, Suit.CLUB]);
        expect(Suit.REDS).toEqual([Suit.HEART, Suit.DIAMOND]);
    });

    it("allows types to be defined by specialization with arguments missing", function () {
        var Color, Suit;
        // Define Color with two arguments missing.
        Color = Enumeration.specialize("id", "name", {
            BLACK: ["B", "Black"],
            RED: ["R", "Red"]
        });
        // Verify Color.
        expect(Color.BLACK.id).toEqual("B");
        expect(Color.BLACK.name).toEqual("Black");
        expect(Color.RED.id).toEqual("R");
        expect(Color.RED.name).toEqual("Red");
        // Define Suit with one argument missing.
        Suit = Enumeration.specialize("id", "name", {
            color: {
                value: undefined
            }
        }, {
            SPADE: ["S", "Spade", {color: {value: Color.BLACK}}],
            HEART: ["H", "Heart", {color: {value: Color.RED}}],
            DIAMOND: ["D", "Diamond", {color: {value: Color.RED}}],
            CLUB: ["C", "Club", {color: {value: Color.BLACK}}],
            UNKNOWN: ["U", "Unknown"]
        });
        // Verify Suit.
        spades = Suit.SPADE;
        expect(Suit.SPADE).toBe(spades);
        expect(Suit.SPADE.id).toEqual("S");
        expect(Suit.SPADE.name).toEqual("Spade");
        expect(Suit.SPADE.color).toEqual(Color.BLACK);
        hearts = Suit.HEART;
        expect(Suit.HEART).toBe(hearts);
        expect(Suit.HEART.id).toEqual("H");
        expect(Suit.HEART.name).toEqual("Heart");
        expect(Suit.HEART.color).toEqual(Color.RED);
        diamonds = Suit.DIAMOND;
        expect(Suit.DIAMOND).toBe(diamonds);
        expect(Suit.DIAMOND.id).toEqual("D");
        expect(Suit.DIAMOND.name).toEqual("Diamond");
        expect(Suit.DIAMOND.color).toEqual(Color.RED);
        clubs = Suit.CLUB;
        expect(Suit.CLUB).toBe(clubs);
        expect(Suit.CLUB.id).toEqual("C");
        expect(Suit.CLUB.name).toEqual("Club");
        expect(Suit.CLUB.color).toEqual(Color.BLACK);
        unknown = Suit.UNKNOWN;
        expect(Suit.UNKNOWN).toBe(unknown);
        expect(Suit.UNKNOWN.id).toEqual("U");
        expect(Suit.UNKNOWN.name).toEqual("Unknown");
        expect(Suit.UNKNOWN.color).toBeUndefined();
    });

    it("allows types to be defined through a getter", function () {
        var Coin, heads, tails;
        // Define Side through a getter.
        Coin = Montage.specialize({}, {
            Side: {
                get: Enumeration.getterFor("_Side", "id", "name", {
                    reverse: {
                        get: function () {
                            return Coin.Side.SIDES[1 - Coin.Side.SIDES.indexOf(this)];
                        }
                    }
                }, {
                    SIDES: {
                        get: function () {
                            return [Coin.Side.HEADS, Coin.Side.TAILS];
                        }
                    }
                }, {
                    HEADS: ["H", "Heads"],
                    TAILS: ["T", "Tails"]
                })
            }
        });
        // Verify Sides.
        heads = Coin.Side.HEADS;
        expect(Coin.Side.HEADS).toBe(heads);
        expect(Coin.Side.HEADS.id).toEqual("H");
        expect(Coin.Side.HEADS.name).toEqual("Heads");
        expect(Coin.Side.HEADS.reverse).toBe(Coin.Side.TAILS);
        tails = Coin.Side.TAILS;
        expect(Coin.Side.TAILS).toBe(tails);
        expect(Coin.Side.TAILS.id).toEqual("T");
        expect(Coin.Side.TAILS.name).toEqual("Tails");
        expect(Coin.Side.TAILS.reverse).toBe(Coin.Side.HEADS);
        expect(Coin.Side.SIDES).toEqual([Coin.Side.HEADS, Coin.Side.TAILS]);
    });

    it("allows types to be defined through a getter with arguments missing", function () {
        var Coin, heads, tails;
        // Define Side through a getter with one arguments missing.
        Coin = Montage.specialize({}, {
            Side: {
                get: Enumeration.getterFor("_Side", "id", "name", {
                    reverse: {
                        get: function () {
                            return this === Coin.Side.HEADS ? Coin.Side.TAILS : Coin.Side.HEADS;
                        }
                    }
                }, {
                    HEADS: ["H", "Heads"],
                    TAILS: ["T", "Tails"]
                })
            }
        });
        // Verify Sides.
        heads = Coin.Side.HEADS;
        expect(Coin.Side.HEADS).toBe(heads);
        expect(Coin.Side.HEADS.id).toEqual("H");
        expect(Coin.Side.HEADS.name).toEqual("Heads");
        expect(Coin.Side.HEADS.reverse).toBe(Coin.Side.TAILS);
        tails = Coin.Side.TAILS;
        expect(Coin.Side.TAILS).toBe(tails);
        expect(Coin.Side.TAILS.id).toEqual("T");
        expect(Coin.Side.TAILS.name).toEqual("Tails");
        expect(Coin.Side.TAILS.reverse).toBe(Coin.Side.HEADS);
        // Define Side through a getter with two arguments missing.
        Coin = Montage.specialize({}, {
            Side: {
                get: Enumeration.getterFor("_Side", "id", "name", {
                    HEADS: ["H", "Heads"],
                    TAILS: ["T", "Tails"]
                })
            }
        });
        // Verify Sides.
        heads = Coin.Side.HEADS;
        expect(Coin.Side.HEADS).toBe(heads);
        expect(Coin.Side.HEADS.id).toEqual("H");
        expect(Coin.Side.HEADS.name).toEqual("Heads");
        tails = Coin.Side.TAILS;
        expect(Coin.Side.TAILS).toBe(tails);
        expect(Coin.Side.TAILS.id).toEqual("T");
        expect(Coin.Side.TAILS.name).toEqual("Tails");
    });

    it("allows types to be created with a method call", function () {
        // Define Side.
        var Side = Enumeration.specialize("id", "name", {}, {}, {
            HEADS: ["H", "Heads"],
            TAILS: ["T", "Tails"]
        });
        // Verify Sides.
        expect(Side.HEADS.id).toEqual("H");
        expect(Side.HEADS.name).toEqual("Heads");
        expect(Side.TAILS.id).toEqual("T");
        expect(Side.TAILS.name).toEqual("Tails");
        // Add and test a new type of side.
        Side.EDGE = Side.withIdAndName("E", "Edge");
        expect(Side.EDGE.id).toEqual("E");
        expect(Side.EDGE.name).toEqual("Edge");
    });

    it("allows types without unique properties to be defined", function () {
        var side
        // Test with a number of possible no-unique-properties values.
        [[], "", null, undefined].forEach(function (uniqueProperties) {
            // Define Sides.
            Side = Enumeration.specialize(uniqueProperties, "id", "name", {
                HEADS: ["H", "Heads"],
                TAILS: ["T", "Tails"]
            });
            // Verify Sides.
            expect(Side.HEADS.id).toEqual("H");
            expect(Side.HEADS.name).toEqual("Heads");
            expect(Side.TAILS.id).toEqual("T");
            expect(Side.TAILS.name).toEqual("Tails");
        });
    });

    it("allows types to be looked up by unique property value", function () {
        // Define Side with a single unique property.
        var Side = Enumeration.specialize("initial", "name", {
            HEADS: ["H", "Heads"],
            TAILS: ["T", "Tails"]
        });
        // Lookup Sides by unique property names.
        expect(Side.forInitial("H")).toBe(Side.HEADS);
        expect(Side.forInitial("T")).toBe(Side.TAILS);
        // Define Side with multiple unique properties.
        Side = Enumeration.specialize(["letter", "number"] , "name", {
            HEADS: ["H", 1, "Heads"],
            TAILS: ["T", 2, "Tails"]
        });
        // Lookup Sides by unique property names.
        expect(Side.forLetter("H")).toBe(Side.HEADS);
        expect(Side.forLetter("T")).toBe(Side.TAILS);
        expect(Side.forNumber(1)).toBe(Side.HEADS);
        expect(Side.forNumber(2)).toBe(Side.TAILS);
    });

});
