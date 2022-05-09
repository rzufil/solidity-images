import React from "react";

const Nav = ({ account }) => {
    return (
        <nav className="navbar navbar-toggleable-md navbar-light bg-light shadow">
            <div className="container">
                <span className="navbar-brand">Image Showcase</span>
                <ul className="nav navbar-nav d-flex">
                    <li className="nav-item disabled">
                        <span>{account}</span>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Nav;