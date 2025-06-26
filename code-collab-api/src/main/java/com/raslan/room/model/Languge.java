package com.raslan.room.model;

public enum Languge {
    PYTHON("python"),
    JAVASCRIPT("javascript"),
    JAVA("java"),
    CPP("c++");
    private final String name;

    Languge(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
