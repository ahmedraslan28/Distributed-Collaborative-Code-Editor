package com.raslan.room.model;

public enum language {
    PYTHON("python"),
    JAVASCRIPT("javascript"),
    JAVA("java"),
    CPP("cpp");
    private final String name;

    language(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
